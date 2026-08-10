const express = require("express");
const router = express.Router();
const ConfiguracoesController = require("../controllers/configuracoes.controller");
const { authenticate, requireAdmin } = require("../middlewares/auth");

router.get("/", ConfiguracoesController.list);
router.put("/:chave", authenticate, requireAdmin, ConfiguracoesController.upsert);

module.exports = router;
