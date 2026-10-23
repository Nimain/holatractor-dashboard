import { Pool } from "pg";

import fs from "fs";
import path from "path";

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("DATABASE_URL=")) {
          connectionString = trimmed.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
          process.env.DATABASE_URL = connectionString;
          break;
        }
      }
    }
  } catch {}
}

let pool: Pool;

declare global {
  var _postgresPool: Pool | undefined;
}

if (
  !global._postgresPool ||
  (global._postgresPool as any)._ended ||
  !(global._postgresPool as any).options?.connectionString
) {
  global._postgresPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

pool = global._postgresPool;

export default pool;
