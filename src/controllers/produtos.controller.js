const prisma = require("../prisma/client");

async function list(req, res, next) {
  try {
    const { categoriaId, somenteAtivos } = req.query;
    const where = {};
    if (categoriaId) where.categoriaId = categoriaId;
    if (somenteAtivos !== "false") where.ativo = true;
    const produtos = await prisma.produto.findMany({
      where,
      include: { categoria: true },
      orderBy: { nome: "asc" },
    });
    res.json(produtos);
  } catch (e) {
    next(e);
  }
}

async function get(req, res, next) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: req.params.id },
      include: { categoria: true },
    });
    if (!produto) return res.status(404).json({ error: "Produto não encontrado" });
    res.json(produto);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const { nome, descricao, preco, imagem, estoque, estoque_minimo, categoriaId, ativo } = req.body;
    if (!nome || preco === undefined) {
      return res.status(400).json({ error: "nome e preco são obrigatórios" });
    }
    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        preco,
        imagem,
        estoque: estoque ?? 0,
        estoque_minimo: estoque_minimo ?? 0,
        categoriaId: categoriaId || null,
        ativo: ativo ?? true,
      },
    });
    res.status(201).json(produto);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const { nome, descricao, preco, imagem, categoriaId, ativo } = req.body;
    const produto = await prisma.produto.update({
      where: { id: req.params.id },
      data: { nome, descricao, preco, imagem, categoriaId, ativo },
    });
    res.json(produto);
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const produto = await prisma.produto.update({
      where: { id: req.params.id },
      data: { ativo: false },
    });
    res.json(produto);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, get, create, update, remove };
