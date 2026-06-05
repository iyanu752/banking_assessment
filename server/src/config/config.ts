import "dotenv/config";

const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  dbPath: process.env.DB_PATH ?? "./banking.db",
  apiKey: process.env.API_KEY ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
};

export default config;