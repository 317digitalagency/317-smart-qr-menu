"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, ChevronRight, Send, HelpCircle, Tag, Settings, Handshake } from "lucide-react";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const phoneNumber = "905376769546";

  const CTAS = [
    {
      icon: <Tag size={14} className="text-[#25D366] shrink-0" strokeWidth={2.5} />,
      label: "Fiyatlar hakkında bilgi",
      text: "Merhaba, fiyatlar ve Pro üyelik hakkında bilgi alabilir miyim?",
    },
    {
      icon: <Settings size={14} className="text-[#25D366] shrink-0" strokeWidth={2.5} />,
      label: "Sistem kurulum desteği",
      text: "Merhaba, QR menü sisteminin kurulumu konusunda destek alabilir miyim?",
    },
    {
      icon: <Handshake size={14} className="text-[#25D366] shrink-0" strokeWidth={2.5} />,
      label: "Özel entegrasyon talebi",
      text: "Merhaba, restoranımız için özel entegrasyonlar hakkında görüşmek istiyorum.",
    },
  ];

  const getWhatsAppUrl = (message: string) => {
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50 font-sans antialiased select-none">
      
      {/* ── Popover Panel (Glassmorphic layout) ── */}
      {isOpen && (
        <div 
          className="absolute bottom-16 right-0 w-[320px] max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md rounded-3xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden transition-all duration-300 ease-out origin-bottom-right"
          style={{
            animation: "fadeUp 250ms cubic-bezier(0.16, 1, 0.3, 1) both"
          }}
        >
          {/* Header */}
          <div className="bg-[#25D366] p-4 text-white relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MessageCircle size={22} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-[14.5px] font-bold tracking-tight">Soru Sorun</h3>
                <p className="text-[11px] text-white/90 font-medium">Ortalama yanıt süresi: 5 dakika</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white border-none cursor-pointer transition-colors active:scale-95"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 bg-[var(--bg-base)] flex flex-col gap-2">
            <p className="text-xs text-[var(--text-secondary)] font-medium mb-1.5 leading-relaxed">
              Merhaba! Hızlı yanıt almak için aşağıdaki konulardan birini seçebilir veya doğrudan yazabilirsiniz.
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-col gap-2">
              {CTAS.map((cta, index) => (
                <a
                  key={index}
                  href={getWhatsAppUrl(cta.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 bg-white hover:bg-[#f0fdf4] border border-[var(--border-subtle)] rounded-2xl text-xs font-semibold text-[var(--text-primary)] hover:text-[#16a34a] no-underline transition-all duration-150 active:scale-[0.98] inline-flex"
                >
                  {cta.icon}
                  <span className="truncate pr-2 flex-1 text-left">{cta.label}</span>
                  <ChevronRight size={13} className="shrink-0 text-[var(--text-tertiary)]" />
                </a>
              ))}
            </div>

            {/* General Direct CTA */}
            <a
              href={getWhatsAppUrl("Merhaba, bir sorum vardı.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-2xl no-underline transition-all duration-150 active:scale-[0.98] shadow-md shadow-emerald-600/10"
            >
              <Send size={13} fill="white" />
              Doğrudan Yazın
            </a>
          </div>
        </div>
      )}

      {/* ── Yüzen Buton (Floating Button with badge) ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 h-12 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white border-none cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-95 transition-all duration-150 font-bold text-sm tracking-tight"
        style={{
          boxShadow: "0 8px 30px rgba(37, 211, 102, 0.35)"
        }}
      >
        <MessageCircle size={20} fill="white" className="shrink-0" />
        <span className="max-w-[120px] overflow-hidden truncate whitespace-nowrap">Soru Sorun</span>
      </button>

    </div>
  );
}
