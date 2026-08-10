const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash(process.env.ADMIN_PIN || "2026", 10);
  let admin = await prisma.user.findFirst({
    where: { telefone: "00000000000" },
  });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        nome: "Administrador",
        telefone: "00000000000",
        senha_hash: senha,
        tipo: "ADMIN",
      },
    });
  }

  let cat = await prisma.categoria.findFirst({ where: { nome: "Padrão" } });
  if (!cat) {
    cat = await prisma.categoria.create({
      data: { nome: "Padrão", ordem: 0, ativo: true },
    });
  }

  const p1 = await prisma.produto.findFirst({
    where: { nome: "Açaí do Norte (Litro)" },
  });
  if (!p1) {
    await prisma.produto.create({
      data: {
        nome: "Açaí do Norte (Litro)",
        descricao: "",
        preco: 35,
        imagem: "/icone-acai.jpg",
        estoque: 50,
        estoque_minimo: 5,
        ativo: true,
        categoriaId: cat.id,
      },
    });
  }

  const p2 = await prisma.produto.findFirst({
    where: { nome: "Polpa de Açaí" },
  });
  if (!p2) {
    await prisma.produto.create({
      data: {
        nome: "Polpa de Açaí",
        descricao: "",
        preco: 60,
        imagem: "/icone-acai.jpg",
        estoque: 20,
        estoque_minimo: 5,
        ativo: true,
        categoriaId: cat.id,
      },
    });
  }

  const p3 = await prisma.produto.findFirst({ where: { nome: "Farinha" } });
  if (!p3) {
    await prisma.produto.create({
      data: {
        nome: "Farinha",
        descricao: "",
        preco: 20,
        imagem: "/icone-farinha.jpg",
        estoque: 30,
        estoque_minimo: 5,
        ativo: true,
        categoriaId: cat.id,
      },
    });
  }

  const retiradaPad = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
  ];
  for (const h of retiradaPad) {
    const exists = await prisma.horario.findFirst({
      where: { hora: h, tipo: "retirada" },
    });
    if (!exists) {
      await prisma.horario.create({ data: { tipo: "retirada", hora: h } });
    }
  }

  const entregaPad = [
    "11:00 - 12:00",
    "12:00 - 13:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
  ];
  for (const h of entregaPad) {
    const exists = await prisma.horario.findFirst({
      where: { hora: h, tipo: "entrega" },
    });
    if (!exists) {
      await prisma.horario.create({ data: { tipo: "entrega", hora: h } });
    }
  }

  const cfg = await prisma.configuracao.findFirst({
    where: { chave: "taxa_entrega" },
  });
  if (!cfg) {
    await prisma.configuracao.create({
      data: { chave: "taxa_entrega", valor: "5.00" },
    });
  }
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
