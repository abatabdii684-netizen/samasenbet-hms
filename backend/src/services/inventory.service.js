const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

class InventoryService {
  async getAll({ skip, limit, search, categoryId }) {
    const where = { isActive: true };
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (search) {
      where.OR = [
        { name:     { contains: search } },
        { itemCode: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
        include: { category: true },
      }),
      prisma.inventoryItem.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { category: true, movements: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!item) throw AppError.notFound('Inventory item not found');
    return item;
  }

  async create(data) {
    const existing = await prisma.inventoryItem.findUnique({ where: { itemCode: data.itemCode } });
    if (existing) throw AppError.conflict('Item code already exists');
    return prisma.inventoryItem.create({
      data: {
        itemCode:     data.itemCode,
        name:         data.name,
        categoryId:   parseInt(data.categoryId),
        unit:         data.unit,
        quantity:     parseInt(data.quantity)     || 0,
        reorderLevel: parseInt(data.reorderLevel) || 5,
        unitCost:     parseFloat(data.unitCost),
        location:     data.location || null,
      },
      include: { category: true },
    });
  }

  async update(id, data) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw AppError.notFound('Inventory item not found');
    return prisma.inventoryItem.update({ where: { id }, data, include: { category: true } });
  }

  async delete(id) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw AppError.notFound('Inventory item not found');
    return prisma.inventoryItem.update({ where: { id }, data: { isActive: false } });
  }

  async stockIn(id, data, performedById) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw AppError.notFound('Item not found');
    const qty = parseInt(data.quantity);

    await prisma.inventoryMovement.create({
      data: { itemId: id, type: 'IN', quantity: qty, reference: data.reference, reason: data.reason, performedById },
    });

    return prisma.inventoryItem.update({
      where: { id },
      data:  { quantity: item.quantity + qty },
      include: { category: true },
    });
  }

  async stockOut(id, data, performedById) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw AppError.notFound('Item not found');
    const qty = parseInt(data.quantity);
    if (item.quantity < qty) throw AppError.badRequest(`Insufficient stock. Available: ${item.quantity}`);

    await prisma.inventoryMovement.create({
      data: { itemId: id, type: 'OUT', quantity: qty, reference: data.reference, reason: data.reason, performedById },
    });

    return prisma.inventoryItem.update({
      where: { id },
      data:  { quantity: item.quantity - qty },
      include: { category: true },
    });
  }

  async getLowStock() {
    return prisma.inventoryItem.findMany({
      where: { isActive: true, quantity: { lte: prisma.inventoryItem.fields.reorderLevel } },
      include: { category: true },
    }).then(() =>
      // Fallback: manual filter
      prisma.inventoryItem.findMany({ where: { isActive: true }, include: { category: true } })
        .then((items) => items.filter((i) => i.quantity <= i.reorderLevel))
    );
  }

  async getCategories() {
    return prisma.inventoryCategory.findMany({ orderBy: { name: 'asc' } });
  }
}

module.exports = new InventoryService();
