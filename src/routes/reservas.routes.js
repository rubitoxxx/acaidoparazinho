const express = require("express");
const router = express.Router();
const ReservasController = require("../controllers/reservas.controller");
const { authenticate, requireAdmin, optionalAuth } = require("../middlewares/auth");

router.get("/", optionalAuth, ReservasController.list);
router.get("/:id", ReservasController.get);
router.post("/", optionalAuth, ReservasController.create);
router.post("/:id/solicitar-cancelamento", ReservasController.solicitarCancelamento);

router.put("/:id/status", authenticate, requireAdmin, ReservasController.updateStatus);
router.delete("/:id", authenticate, requireAdmin, ReservasController.remove);

module.exports = router;
