const express = require("express");
const router = express.Router();
const EstoqueController = require("../controllers/estoque.controller");
const { authenticate, requireAdmin } = require("../middlewares/auth");

router.get("/", EstoqueController.list);
router.put("/:produtoId", authenticate, requireAdmin, EstoqueController.update);

module.exports = router;
