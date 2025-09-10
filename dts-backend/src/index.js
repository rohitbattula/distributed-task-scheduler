import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

async function main() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`🚀 Server listening on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

main();
