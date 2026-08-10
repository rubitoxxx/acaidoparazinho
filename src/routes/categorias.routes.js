const express = require("express");
const router = express.Router();
const CategoriasController = require("../controllers/categorias.controller");
const { authenticate, requireAdmin } = require("../middlewares/auth");

router.get("/", CategoriasController.list);
router.post("/", authenticate, requireAdmin, CategoriasController.create);
router.put("/:id", authenticate, requireAdmin, CategoriasController.update);
router.delete("/:id", authenticate, requireAdmin, CategoriasController.remove);

module.exports = router;
