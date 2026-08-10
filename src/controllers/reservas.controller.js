const { z } = require("zod");
const prisma = require("../prisma/client");

const itemSchema = z.object({
  produtoId: z.string().optional().nullable(),
  qtd: z.number().int().positive(),
  preco: z.number().nonnegative(),
});

const createSchema = z.object({
  nome: z.string().min(1),
  telefone: z.string().min(8),
  tipo: z.enum(["retirada", "entrega"]),
  data: z.string().min(1),
  horario: z.string().min(1),
  endereco: z.string().optional().nullable(),
  obs: z.string().optional().nullable(),
  itens: z.array(itemSchema).min(1),
  taxaEntrega: z.number().nonnegative().optional().default(0),
});

function gerarCodigo() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `PZ-${n}`;
}

async function list(req, res, next) {
  try {
    const { telefone, status } = req.query;
    const where = {};
    if (!req.user || req.user.tipo !== "ADMIN") {
      if (!telefone) return res.status(400).json({ error: "Informe o telefone para consultar seus pedidos" });
      where.telefone = telefone;
    } else if (telefone) {
      where.telefone = telefone;
    }
    if (status) where.status = status;

    const reservas = await prisma.reserva.findMany({
      where,
      include: { itens: { include: { produto: true } } },
      orderBy: { criadoEm: "desc" },
    });
    res.json(reservas);
  } catch (e) {
    next(e);
  }
}

async function get(req, res, next) {
  try {
    const id = req.params.id;
    const reserva = await prisma.reserva.findFirst({
      where: { OR: [{ id }, { codigo: id }] },
      include: { itens: { include: { produto: true } } },
    });
    if (!reserva) return res.status(404).json({ error: "Pedido não encontrado" });
    res.json(reserva);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos", detalhes: parsed.error.flatten() });
    }
    const data = parsed.data;

    if (data.tipo === "entrega" && !data.endereco) {
      return res.status(400).json({ error: "Endereço é obrigatório para entrega" });
    }

    const subtotal = data.itens.reduce((s, i) => s + i.qtd * i.preco, 0);
    const total = subtotal + (data.taxaEntrega || 0);

    const criada = await prisma.$transaction(async (tx) => {
      for (const it of data.itens) {
        if (!it.produtoId) continue;
        const produto = await tx.produto.findUnique({ where: { id: it.produtoId } });
        if (!produto) throw Object.assign(new Error(`Produto ${it.produtoId} não encontrado`), { status: 404 });
        if (produto.estoque < it.qtd) {
          throw Object.assign(
            new Error(`Estoque insuficiente para "${produto.nome}" (disponível: ${produto.estoque})`),
            { status: 409 },
          );
        }
      }

      const usuarioId = req.user ? req.user.id : null;

      const reserva = await tx.reserva.create({
        data: {
          codigo: gerarCodigo(),
          usuarioId,
          nome: data.nome,
          telefone: data.telefone,
          tipo: data.tipo,
          status: "pendente",
          data: data.data,
          horario: data.horario,
          endereco: data.endereco || null,
          subtotal,
          taxaEntrega: data.taxaEntrega || 0,
          total,
          obs: data.obs || null,
          estoqueDescontado: true,
        },
      });

      for (const it of data.itens) {
        await tx.itensReserva.create({
          data: {
            reservaId: reserva.id,
            produtoId: it.produtoId || null,
            quantidade: it.qtd,
            valorUnitario: it.preco,
            subtotal: it.qtd * it.preco,
          },
        });
        if (it.produtoId) {
          await tx.produto.update({
            where: { id: it.produtoId },
            data: { estoque: { decrement: it.qtd } },
          });
          await tx.movimentacaoEstoque.create({
            data: {
              produtoId: it.produtoId,
              tipo: "saida",
              quantidade: it.qtd,
              motivo: `Pedido ${reserva.codigo}`,
            },
          });
        }
      }

      return tx.reserva.findUnique({ where: { id: reserva.id }, include: { itens: true } });
    });

    res.status(201).json(criada);
  } catch (e) {
    next(e);
  }
}

async function updateStatus(req, res, next) {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const permitidos = [
      "pendente",
      "confirmada",
      "em_preparo",
      "pronta_retirada",
      "saiu_entrega",
      "concluida",
      "cancelada",
      "solicitacao_cancelamento",
    ];
    if (!permitidos.includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const reserva = await prisma.$transaction(async (tx) => {
      const atual = await tx.reserva.findUnique({ where: { id }, include: { itens: true } });
      if (!atual) throw Object.assign(new Error("Pedido não encontrado"), { status: 404 });

      if (status === "cancelada" && atual.status !== "cancelada" && atual.estoqueDescontado) {
        for (const item of atual.itens) {
          if (!item.produtoId) continue;
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { estoque: { increment: item.quantidade } },
          });
          await tx.movimentacaoEstoque.create({
            data: {
              produtoId: item.produtoId,
              tipo: "entrada",
              quantidade: item.quantidade,
              motivo: `Cancelamento do pedido ${atual.codigo}`,
            },
          });
        }
      }

      return tx.reserva.update({
        where: { id },
        data: {
          status,
          statusAnterior: null,
          estoqueDescontado: status === "cancelada" ? false : atual.estoqueDescontado,
        },
      });
    });

    res.json(reserva);
  } catch (e) {
    next(e);
  }
}

async function solicitarCancelamento(req, res, next) {
  try {
    const id = req.params.id;
    const atual = await prisma.reserva.findUnique({ where: { id } });
    if (!atual) return res.status(404).json({ error: "Pedido não encontrado" });
    const reserva = await prisma.reserva.update({
      where: { id },
      data: { status: "solicitacao_cancelamento", statusAnterior: atual.status },
    });
    res.json(reserva);
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const id = req.params.id;
    await prisma.$transaction(async (tx) => {
      const atual = await tx.reserva.findUnique({ where: { id }, include: { itens: true } });
      if (!atual) throw Object.assign(new Error("Pedido não encontrado"), { status: 404 });

      if (atual.status !== "cancelada" && atual.estoqueDescontado) {
        for (const item of atual.itens) {
          if (!item.produtoId) continue;
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { estoque: { increment: item.quantidade } },
          });
          await tx.movimentacaoEstoque.create({
            data: {
              produtoId: item.produtoId,
              tipo: "entrada",
              quantidade: item.quantidade,
              motivo: `Exclusão do pedido ${atual.codigo}`,
            },
          });
        }
      }

      await tx.itensReserva.deleteMany({ where: { reservaId: id } });
      await tx.reserva.delete({ where: { id } });
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, get, create, updateStatus, solicitarCancelamento, remove };
