// src/db/index.ts
// Drizzle ORM connection helper
//
// DEV  (NODE_ENV !== production):  libsql → lokal Miniflare D1 SQLite
// PROD (NODE_ENV === production):  CF D1 binding via getCloudflareContext()

import * as schema from "./schema";
import * as relations from "./relations";

// Lokal Miniflare D1 SQLite dosyası
// "wrangler d1 execute --local" bu dosyaya yazar.
const LOCAL_D1_SQLITE =
  ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/8fd99c0e8e81e5311e85b0f05b684270671a700bf1253ddf39ac89913e2658fd.sqlite";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _devDb: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any {
  // Production & preview: Cloudflare D1 binding
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/d1");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const d1 = env.DB as D1Database;
    if (!d1) throw new Error("CF D1 binding 'DB' not found in production");
    return drizzle(d1, { schema: { ...schema, ...relations } });
  }

  // Dev: libsql → local SQLite (singleton)
  if (_devDb) return _devDb;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@libsql/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/libsql");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");

  const dbPath = path.resolve(process.cwd(), LOCAL_D1_SQLITE);
  const client = createClient({ url: "file:" + dbPath });
  _devDb = drizzle(client, { schema: { ...schema, ...relations } });
  return _devDb;
}

export type DrizzleDB = ReturnType<typeof getDb>;

// Re-export schema for convenience
export * from "./schema";
export * from "./relations";
