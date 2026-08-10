const express = require("express");
const router = express.Router();
const HorariosController = require("../controllers/horarios.controller");
const { authenticate, requireAdmin } = require("../middlewares/auth");

router.get("/", HorariosController.list);
router.post("/", authenticate, requireAdmin, HorariosController.create);
router.put("/:id", authenticate, requireAdmin, HorariosController.update);
router.delete("/:id", authenticate, requireAdmin, HorariosController.remove);

module.exports = router;
