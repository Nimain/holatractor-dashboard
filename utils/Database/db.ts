import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://nimain:DxbBkXHqc0ZvzAZFtRVXRT3vthZ4xYqO@dpg-cv973d5umphs73flh6ug-a.oregon-postgres.render.com/holadata_poaf?sslmode=require";

let pool: Pool;

declare global {
  var _postgresPool: Pool | undefined;
}

if (!global._postgresPool) {
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
