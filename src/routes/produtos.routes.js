const express = require("express");
const router = express.Router();
const ProdutosController = require("../controllers/produtos.controller");
const { authenticate, requireAdmin } = require("../middlewares/auth");

router.get("/", ProdutosController.list);
router.get("/:id", ProdutosController.get);
router.post("/", authenticate, requireAdmin, ProdutosController.create);
router.put("/:id", authenticate, requireAdmin, ProdutosController.update);
router.delete("/:id", authenticate, requireAdmin, ProdutosController.remove);

module.exports = router;
