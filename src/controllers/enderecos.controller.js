const prisma = require("../prisma/client");

async function list(req, res, next) {
  try {
    const enderecos = await prisma.endereco.findMany({ where: { usuarioId: req.user.id } });
    res.json(enderecos);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const { apelido, rua, numero, bairro, cidade, estado, cep, referencia, principal } = req.body;
    if (!apelido || !rua || !numero || !bairro) {
      return res.status(400).json({ error: "apelido, rua, numero e bairro são obrigatórios" });
    }
    const endereco = await prisma.$transaction(async (tx) => {
      if (principal) {
        await tx.endereco.updateMany({ where: { usuarioId: req.user.id }, data: { principal: false } });
      }
      return tx.endereco.create({
        data: {
          usuarioId: req.user.id,
          apelido,
          rua,
          numero,
          bairro,
          cidade,
          estado,
          cep,
          referencia,
          principal: !!principal,
        },
      });
    });
    res.status(201).json(endereco);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const existente = await prisma.endereco.findUnique({ where: { id } });
    if (!existente || existente.usuarioId !== req.user.id) {
      return res.status(404).json({ error: "Endereço não encontrado" });
    }
    const { apelido, rua, numero, bairro, cidade, estado, cep, referencia, principal } = req.body;
    const endereco = await prisma.$transaction(async (tx) => {
      if (principal) {
        await tx.endereco.updateMany({ where: { usuarioId: req.user.id }, data: { principal: false } });
      }
      return tx.endereco.update({
        where: { id },
        data: { apelido, rua, numero, bairro, cidade, estado, cep, referencia, principal },
      });
    });
    res.json(endereco);
  } catch (e) {
    next(e);
  }
}

async function setPrincipal(req, res, next) {
  try {
    const { id } = req.params;
    const existente = await prisma.endereco.findUnique({ where: { id } });
    if (!existente || existente.usuarioId !== req.user.id) {
      return res.status(404).json({ error: "Endereço não encontrado" });
    }
    await prisma.$transaction([
      prisma.endereco.updateMany({ where: { usuarioId: req.user.id }, data: { principal: false } }),
      prisma.endereco.update({ where: { id }, data: { principal: true } }),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const existente = await prisma.endereco.findUnique({ where: { id } });
    if (!existente || existente.usuarioId !== req.user.id) {
      return res.status(404).json({ error: "Endereço não encontrado" });
    }
    await prisma.endereco.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, update, setPrincipal, remove };
