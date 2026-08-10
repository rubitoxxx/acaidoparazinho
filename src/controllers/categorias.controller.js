const prisma = require("../prisma/client");

async function list(req, res, next) {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { ativo: true },
      orderBy: { ordem: "asc" },
    });
    res.json(categorias);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const { nome, ordem, ativo } = req.body;
    if (!nome) return res.status(400).json({ error: "nome é obrigatório" });
    const categoria = await prisma.categoria.create({
      data: { nome, ordem: ordem ?? 0, ativo: ativo ?? true },
    });
    res.status(201).json(categoria);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const { nome, ordem, ativo } = req.body;
    const categoria = await prisma.categoria.update({
      where: { id: req.params.id },
      data: { nome, ordem, ativo },
    });
    res.json(categoria);
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    await prisma.categoria.update({
      where: { id: req.params.id },
      data: { ativo: false },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, update, remove };
