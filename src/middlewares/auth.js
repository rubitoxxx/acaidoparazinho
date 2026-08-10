const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token ausente" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, tipo: payload.tipo };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub, tipo: payload.tipo };
    } catch (e) {
      // token inválido em rota opcional: segue como visitante anônimo
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.tipo !== "ADMIN") {
    return res.status(403).json({ error: "Acesso restrito ao administrador" });
  }
  next();
}

module.exports = { authenticate, optionalAuth, requireAdmin };
