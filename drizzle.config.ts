import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// 環境変数を読み込み（ローカル開発用）
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
