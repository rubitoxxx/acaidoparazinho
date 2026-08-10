const bcrypt = require("bcryptjs");
const prisma = require("../prisma/client");

function toSafeUser(user) {
  if (!user) return user;
  const { senha_hash, ...safe } = user;
  return safe;
}

async function list(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(users.map(toSafeUser));
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const { nome, telefone, email, senha, tipo } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    const telClean = telefone ? String(telefone).replace(/\D/g, "") : "";
    if (!telClean && !email) {
      return res.status(400).json({ error: "Informe ao menos o telefone ou e-mail do usuário" });
    }

    if (telClean) {
      const existsTel = await prisma.user.findFirst({ where: { telefone: telClean } });
      if (existsTel) {
        return res.status(409).json({ error: "Já existe um usuário cadastrado com este telefone" });
      }
    }
    if (email && email.trim()) {
      const existsEmail = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase() } });
      if (existsEmail) {
        return res.status(409).json({ error: "Já existe um usuário cadastrado com este e-mail" });
      }
    }

    const senhaFinal = senha && senha.trim() ? senha.trim() : "123456";
    const hash = await bcrypt.hash(senhaFinal, 10);
    const userType = tipo && tipo.toUpperCase() === "ADMIN" ? "ADMIN" : "CLIENTE";

    const newUser = await prisma.user.create({
      data: {
        nome: nome.trim(),
        telefone: telClean || null,
        email: email && email.trim() ? email.trim().toLowerCase() : null,
        senha_hash: hash,
        tipo: userType,
      },
    });

    res.status(201).json(toSafeUser(newUser));
  } catch (e) {
    next(e);
  }
}

async function get(req, res, next) {
  try {
    const id = req.params.id;
    if (req.user.tipo !== "ADMIN" && req.user.id !== id) {
      return res.status(403).json({ error: "Sem permissão para ver este usuário" });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(toSafeUser(user));
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const id = req.params.id;
    if (req.user.tipo !== "ADMIN" && req.user.id !== id) {
      return res.status(403).json({ error: "Sem permissão para editar este usuário" });
    }
    const { nome, telefone, email, tipo, senha } = req.body;
    const data = {};
    if (nome) data.nome = nome.trim();
    if (telefone !== undefined) data.telefone = telefone ? String(telefone).replace(/\D/g, "") : null;
    if (email !== undefined) data.email = email ? email.trim().toLowerCase() : null;
    if (req.user.tipo === "ADMIN" && tipo) data.tipo = tipo.toUpperCase() === "ADMIN" ? "ADMIN" : "CLIENTE";
    if (senha && senha.trim()) {
      data.senha_hash = await bcrypt.hash(senha.trim(), 10);
    }
    const user = await prisma.user.update({ where: { id }, data });
    res.json(toSafeUser(user));
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const id = req.params.id;
    if (req.user.tipo !== "ADMIN") {
      return res.status(403).json({ error: "Apenas administradores podem excluir usuários" });
    }
    if (req.user.id === id) {
      return res.status(400).json({ error: "Você não pode excluir sua própria conta de administrador" });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, get, update, remove };
