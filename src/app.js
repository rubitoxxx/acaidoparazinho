const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(compression());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
app.use(limiter);

const uploadsDir = process.env.UPLOAD_PATH || "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.use("/api", routes);

const publicPath = path.resolve(__dirname, "../public");
app.use(express.static(publicPath));

app.get(["/loja", "/admin"], (req, res) => {
  res.sendFile(path.join(publicPath, "loja.html"));
});

app.get(/^(?!\/api|\/uploads)[^.]*$/, (req, res, next) => {
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) next(err);
  });
});

app.use(errorHandler);

module.exports = app;
