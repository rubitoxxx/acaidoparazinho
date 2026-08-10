const http = require("http");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
process.env.JWT_SECRET = process.env.JWT_SECRET || "acai_parazinho_secret_jwt_2026_key";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "acai_parazinho_refresh_jwt_2026_key";
process.env.ADMIN_PIN = process.env.ADMIN_PIN || "2026";

// Auto-initialize SQLite database schema and seed default records if needed
try {
  console.log("Initializing database...");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
  const seedScript = path.resolve(__dirname, "../prisma/seed.js");
  if (fs.existsSync(seedScript)) {
    execSync(`node "${seedScript}"`, { stdio: "inherit" });
  }
} catch (e) {
  console.warn("Database initialization status:", e.message);
}

const app = require("./app");
const { Server } = require("socket.io");

const port = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || "*" },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

module.exports = { server, io };
