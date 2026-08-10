const prisma = require("../prisma/client");

async function list(req, res, next) {
  try {
    const configs = await prisma.configuracao.findMany();
    const mapa = Object.fromEntries(configs.map((c) => [c.chave, c.valor]));
    res.json(mapa);
  } catch (e) {
    next(e);
  }
}

async function upsert(req, res, next) {
  try {
    const { chave } = req.params;
    const { valor } = req.body;
    if (valor === undefined) return res.status(400).json({ error: "valor é obrigatório" });
    const config = await prisma.configuracao.upsert({
      where: { chave },
      update: { valor: String(valor) },
      create: { chave, valor: String(valor) },
    });
    res.json(config);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, upsert };
