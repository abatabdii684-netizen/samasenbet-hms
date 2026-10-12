/**
 * Add initial drug stock for all drugs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('💊 Adding drug stock...\n');

  const drugs = await prisma.drug.findMany();

  for (const drug of drugs) {
    await prisma.drugStock.create({
      data: {
        drugId:        drug.id,
        batchNumber:   `BATCH-${drug.drugCode}-001`,
        quantity:      500,
        expiryDate:    new Date('2028-12-31'),
        purchasePrice: drug.unitPrice,
        receivedAt:    new Date(),
      },
    });
    console.log(`  ✓ ${drug.genericName} — 500 units added`);
  }

  console.log('\n✅ Drug stock added successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
