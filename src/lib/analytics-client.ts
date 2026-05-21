// src/lib/analytics-client.ts
// Frontend analytics batching — QR menü müşteri davranış takibi
//
// Öncelik sırası:
// 1. Normal batch fetch (5 sn veya 50 event dolunca)
// 2. pagehide/visibilitychange → sendBeacon (sayfa kapanırken)
// 3. sendBeacon başarısız → fetch keepalive (son çare)
// 4. Gönderim başarısız → sessionStorage fallback queue
//
// fetchLater opsiyonel iyileştirme olarak kullanılabilir
// ama sistem ona bağımlı değil.

"use client";

const BATCH_WINDOW_MS = 5_000; // 5 saniye
const MAX_QUEUE_SIZE = 50;
const ANALYTICS_ENDPOINT = "/api/analytics";
const SESSION_KEY = "menu_sid";
const FALLBACK_QUEUE_KEY = "menu_aq";

export type AnalyticsEventInput = {
  restaurantId: string;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  sourcePage: string;
};

type QueuedEvent = AnalyticsEventInput & {
  deviceType: string;
  sessionId: string;
  referrer: string | null;
  ts: number;
};

// ─────────────────────────────────────────────────────────
// Internal state (module singleton)
// ─────────────────────────────────────────────────────────

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

// ─────────────────────────────────────────────────────────
// Yardımcı fonksiyonlar
// ─────────────────────────────────────────────────────────

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

// ─────────────────────────────────────────────────────────
// Gönderim fonksiyonları
// ─────────────────────────────────────────────────────────

async function flush(): Promise<void> {
  if (queue.length === 0 || isFlushing) return;

  const batch = [...queue];
  queue = []; // Önce temizle, gönderim sırasında yeni event gelebilir
  isFlushing = true;

  try {
    const res = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(batch),
      keepalive: true,
    });

    if (!res.ok) {
      // Gönderim başarısız: fallback queue'ya yaz
      saveFallbackQueue(batch);
    }
  } catch {
    // Network hatası: fallback queue'ya yaz
    saveFallbackQueue(batch);
  } finally {
    isFlushing = false;
  }
}

/**
 * Sayfa kapanırken/gizlenirken sendBeacon ile güvenli gönderim.
 * sendBeacon başarısız olursa fetch keepalive ile dener.
 */
function flushBeacon(batch: QueuedEvent[]): void {
  if (batch.length === 0) return;

  const body = JSON.stringify(batch);
  const blob = new Blob([body], { type: "application/json" });

  const sent = navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
  if (!sent) {
    // sendBeacon kota doldu veya desteklenmiyor — keepalive fetch
    fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      saveFallbackQueue(batch);
    });
  }
}

// ─────────────────────────────────────────────────────────
// Fallback Queue (sessionStorage)
// ─────────────────────────────────────────────────────────

function saveFallbackQueue(events: QueuedEvent[]): void {
  try {
    const existing: QueuedEvent[] = JSON.parse(
      sessionStorage.getItem(FALLBACK_QUEUE_KEY) ?? "[]"
    );
    // Son 100 eventi sakla (taşma koruması)
    const merged = [...existing, ...events].slice(-100);
    sessionStorage.setItem(FALLBACK_QUEUE_KEY, JSON.stringify(merged));
  } catch {
    // sessionStorage erişim hatası — ignore
  }
}

function drainFallbackQueue(): void {
  try {
    const stored = sessionStorage.getItem(FALLBACK_QUEUE_KEY);
    if (!stored) return;
    sessionStorage.removeItem(FALLBACK_QUEUE_KEY);

    const events: QueuedEvent[] = JSON.parse(stored);
    if (events.length === 0) return;

    fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(events),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────
// Event listener kurulumu (tarayıcıda bir kez çalışır)
// ─────────────────────────────────────────────────────────

if (typeof window !== "undefined") {
  // Sayfa kapanırken kalan queue'yu gönder
  window.addEventListener("pagehide", () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const remaining = [...queue];
    queue = [];
    flushBeacon(remaining);
  });

  // Sekme arka plana geçtiğinde gönder
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const remaining = [...queue];
      queue = [];
      flushBeacon(remaining);
    }
  });

  // Önceki oturumdan kalan başarısız gönderileri yeniden dene
  drainFallbackQueue();
}

// ─────────────────────────────────────────────────────────
// Ana trackEvent fonksiyonu
// ─────────────────────────────────────────────────────────

export function trackEvent(event: AnalyticsEventInput): void {
  if (typeof window === "undefined") return;

  const enrichedEvent: QueuedEvent = {
    ...event,
    deviceType: getDeviceType(),
    sessionId: getSessionId(),
    referrer: document.referrer || null,
    ts: Date.now(),
  };

  queue.push(enrichedEvent);

  // MAX_QUEUE_SIZE dolunca hemen gönder (timer'ı iptal et)
  if (queue.length >= MAX_QUEUE_SIZE) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    flush();
    return;
  }

  // Timer yoksa başlat
  if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, BATCH_WINDOW_MS);
  }
}

// ─────────────────────────────────────────────────────────
// Kısayol fonksiyonlar (tipik use cases için)
// ─────────────────────────────────────────────────────────

export function trackMenuView(restaurantId: string): void {
  trackEvent({
    restaurantId,
    eventType: "menu_view",
    entityType: "general",
    sourcePage: "menu",
  });
}

export function trackCategoryView(
  restaurantId: string,
  categoryId: string
): void {
  trackEvent({
    restaurantId,
    eventType: "category_view",
    entityType: "category",
    entityId: categoryId,
    sourcePage: "menu",
  });
}

export function trackProductView(
  restaurantId: string,
  productId: string,
  sourcePage: string
): void {
  trackEvent({
    restaurantId,
    eventType: "product_view",
    entityType: "product",
    entityId: productId,
    sourcePage,
  });
}

export function trackProductClick(
  restaurantId: string,
  productId: string,
  sourcePage: string
): void {
  trackEvent({
    restaurantId,
    eventType: "product_click",
    entityType: "product",
    entityId: productId,
    sourcePage,
  });
}

export function trackCampaignView(
  restaurantId: string,
  campaignId: string
): void {
  trackEvent({
    restaurantId,
    eventType: "campaign_view",
    entityType: "campaign",
    entityId: campaignId,
    sourcePage: "campaigns",
  });
}

export function trackCampaignClick(
  restaurantId: string,
  campaignId: string
): void {
  trackEvent({
    restaurantId,
    eventType: "campaign_click",
    entityType: "campaign",
    entityId: campaignId,
    sourcePage: "campaigns",
  });
}

export function trackButtonClick(
  restaurantId: string,
  eventType:
    | "google_review_click"
    | "whatsapp_click"
    | "instagram_click"
    | "directions_click"
    | "phone_click",
  sourcePage: string
): void {
  trackEvent({
    restaurantId,
    eventType,
    entityType: "general",
    sourcePage,
  });
}

export function trackRecommendationClick(
  restaurantId: string,
  productId: string
): void {
  trackEvent({
    restaurantId,
    eventType: "recommendation_click",
    entityType: "recommendation",
    entityId: productId,
    sourcePage: "menu",
  });
}
