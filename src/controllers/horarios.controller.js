const prisma = require("../prisma/client");

async function list(req, res, next) {
  try {
    const tipo = req.query.tipo || "retirada";
    const hs = await prisma.horario.findMany({ where: { tipo } });
    res.json(hs);
  } catch (e) {
    next(e);
  }
}
async function create(req, res, next) {
  try {
    const { tipo, hora } = req.body;
    const h = await prisma.horario.create({ data: { tipo, hora } });
    res.status(201).json(h);
  } catch (e) {
    next(e);
  }
}
async function update(req, res, next) {
  try {
    const id = req.params.id;
    const data = req.body;
    const u = await prisma.horario.update({ where: { id }, data });
    res.json(u);
  } catch (e) {
    next(e);
  }
}
async function remove(req, res, next) {
  try {
    const id = req.params.id;
    await prisma.horario.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, update, remove };
