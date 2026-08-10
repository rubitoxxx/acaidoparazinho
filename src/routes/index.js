const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./users.routes"));
router.use("/produtos", require("./produtos.routes"));
router.use("/categorias", require("./categorias.routes"));
router.use("/reservas", require("./reservas.routes"));
router.use("/estoque", require("./estoque.routes"));
router.use("/horarios", require("./horarios.routes"));
router.use("/configuracoes", require("./configuracoes.routes"));
router.use("/enderecos", require("./enderecos.routes"));
router.use("/uploads", require("./uploads.routes"));

module.exports = router;
