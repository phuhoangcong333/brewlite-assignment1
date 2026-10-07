import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  { name: 'Cà phê sữa', price: 35_000 },
  { name: 'Americano', price: 40_000 },
  { name: 'Cappuccino', price: 45_000 },
  { name: 'Trà đào', price: 39_000 },
  { name: 'Latte', price: 45_000 },
  { name: 'Bạc xỉu', price: 38_000 },
  { name: 'Trà vải', price: 39_000 },
  { name: 'Matcha latte', price: 50_000 },
];

const promotions = [
  {
    code: 'GIAM10',
    percent: 10,
    expiresAt: new Date('2026-12-31T23:59:59.999Z'),
    usageLeft: 100,
  },
  {
    code: 'BREW20',
    percent: 20,
    expiresAt: new Date('2026-12-31T23:59:59.999Z'),
    usageLeft: 5,
  },
];

async function seed(): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const existingProducts = await transaction.product.findMany({
      where: { name: { in: products.map(({ name }) => name) } },
      select: { name: true },
    });
    const existingNames = new Set(existingProducts.map(({ name }) => name));
    const missingProducts = products.filter(
      ({ name }) => !existingNames.has(name),
    );

    if (missingProducts.length > 0) {
      await transaction.product.createMany({
        data: missingProducts.map((product) => ({ ...product, stock: 50 })),
      });
    }

    for (const promotion of promotions) {
      await transaction.promotion.upsert({
        where: { code: promotion.code },
        create: promotion,
        update: {},
      });
    }
  });
}

seed()
  .catch((error: unknown) => {
    console.error('Failed to seed the BrewLite database:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
