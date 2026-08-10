const prisma = require("../prisma/client");

async function list(req, res, next) {
  try {
    const produtos = await prisma.produto.findMany({
      select: {
        id: true,
        nome: true,
        estoque: true,
        estoque_minimo: true,
        ativo: true,
      },
      orderBy: { nome: "asc" },
    });
    const comAlerta = produtos.map((p) => ({
      ...p,
      abaixoDoMinimo: p.estoque <= p.estoque_minimo,
    }));
    res.json(comAlerta);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const produtoId = req.params.produtoId;
    const { estoque, estoque_minimo, motivo } = req.body;

    const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
    if (!produto) return res.status(404).json({ error: "Produto não encontrado" });

    const novoEstoque = estoque !== undefined ? Number(estoque) : produto.estoque;
    if (Number.isNaN(novoEstoque) || novoEstoque < 0) {
      return res.status(400).json({ error: "Quantidade de estoque inválida" });
    }
    const diferenca = novoEstoque - produto.estoque;

    const atualizado = await prisma.$transaction(async (tx) => {
      const up = await tx.produto.update({
        where: { id: produtoId },
        data: {
          estoque: novoEstoque,
          estoque_minimo: estoque_minimo !== undefined ? Number(estoque_minimo) : undefined,
        },
      });
      if (diferenca !== 0) {
        await tx.movimentacaoEstoque.create({
          data: {
            produtoId,
            tipo: diferenca > 0 ? "entrada" : "saida",
            quantidade: Math.abs(diferenca),
            motivo: motivo || "Ajuste manual pelo admin",
          },
        });
      }
      return up;
    });

    res.json(atualizado);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, update };
