const express = require("express");
const router = express.Router();
const EnderecosController = require("../controllers/enderecos.controller");
const { authenticate } = require("../middlewares/auth");

router.use(authenticate);
router.get("/", EnderecosController.list);
router.post("/", EnderecosController.create);
router.put("/:id", EnderecosController.update);
router.put("/:id/principal", EnderecosController.setPrincipal);
router.delete("/:id", EnderecosController.remove);

module.exports = router;
