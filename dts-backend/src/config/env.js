import "dotenv/config";

export const env = {
  node: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUrl: process.env.MONGO_URL ?? "mongodb://127.0.0.1:27017/dts",
};
