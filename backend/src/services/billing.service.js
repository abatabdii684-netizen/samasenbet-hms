const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

class BillingService {
  async getAll({ skip, limit, search, status, visitId }) {
    const where = {};
    if (status)  where.status  = status;
    if (visitId) where.visitId = parseInt(visitId);
    if (search) {
      where.OR = [
        { billNo: { contains: search } },
        { patient: { firstName: { contains: search } } },
        { patient: { patientId: { contains: search } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.bill.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient:  { select: { id:true, patientId:true, firstName:true, lastName:true, phone:true } },
          items:    true,
          payments: true,
        },
      }),
      prisma.bill.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        patient:  true,
        items:    { include: { serviceType: true } },
        payments: true,
        visit:    { select: { id:true, visitNo:true, diagnosis:true } },
      },
    });
    if (!bill) throw AppError.notFound('Bill not found');
    return bill;
  }

  async create(data, createdById) {
    // If a bill already exists for this visit, add items to it instead of creating a new one
    if (data.visitId) {
      const existingBill = await prisma.bill.findUnique({
        where: { visitId: parseInt(data.visitId) },
      });
      if (existingBill) {
        // Add new items to the existing bill
        const items = data.items || [];
        for (const item of items) {
          const itemTotal = parseFloat(item.unitPrice) * parseInt(item.quantity || 1) - parseFloat(item.discount || 0);
          await prisma.billItem.create({
            data: {
              billId:        existingBill.id,
              serviceTypeId: item.serviceTypeId ? parseInt(item.serviceTypeId) : null,
              description:   item.description,
              quantity:      parseInt(item.quantity   || 1),
              unitPrice:     parseFloat(item.unitPrice),
              discount:      parseFloat(item.discount || 0),
              total:         itemTotal,
            },
          });
        }
        // Recalculate totals
        const allItems = await prisma.billItem.findMany({ where: { billId: existingBill.id } });
        const subtotal = allItems.reduce((s, i) => s + parseFloat(i.total), 0);
        const discount = parseFloat(existingBill.discount || 0);
        const tax      = parseFloat(existingBill.tax      || 0);
        const total    = subtotal - discount + tax;
        const paid     = parseFloat(existingBill.paidAmount || 0);
        return prisma.bill.update({
          where: { id: existingBill.id },
          data:  { subtotal, total, dueAmount: total - paid },
          include: { patient: true, items: true },
        });
      }
    }

    // Create new bill
    const items = data.items || [];
    const subtotal = items.reduce((s, i) => s + (parseFloat(i.unitPrice) * parseInt(i.quantity || 1)), 0);
    const discount = parseFloat(data.discount || 0);
    const tax      = parseFloat(data.tax      || 0);
    const total    = subtotal - discount + tax;

    return prisma.bill.create({
      data: {
        billNo:     generateId('BLL'),
        patientId:  parseInt(data.patientId),
        visitId:    data.visitId ? parseInt(data.visitId) : null,
        subtotal,
        discount,
        tax,
        total,
        dueAmount:  total,
        notes:      data.notes || null,
        createdById,
        items: {
          create: items.map((item) => ({
            serviceTypeId: item.serviceTypeId ? parseInt(item.serviceTypeId) : null,
            description:   item.description,
            quantity:      parseInt(item.quantity   || 1),
            unitPrice:     parseFloat(item.unitPrice),
            discount:      parseFloat(item.discount || 0),
            total:         parseFloat(item.unitPrice) * parseInt(item.quantity || 1) - parseFloat(item.discount || 0),
          })),
        },
      },
      include: { patient: true, items: true },
    });
  }

  async addItem(billId, item) {
    const bill = await prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) throw AppError.notFound('Bill not found');
    if (bill.status === 'PAID' || bill.status === 'CANCELLED') {
      throw AppError.badRequest('Cannot modify a paid or cancelled bill');
    }

    const itemTotal = parseFloat(item.unitPrice) * parseInt(item.quantity || 1) - parseFloat(item.discount || 0);

    await prisma.billItem.create({
      data: {
        billId,
        serviceTypeId: item.serviceTypeId ? parseInt(item.serviceTypeId) : null,
        description:   item.description,
        quantity:      parseInt(item.quantity   || 1),
        unitPrice:     parseFloat(item.unitPrice),
        discount:      parseFloat(item.discount || 0),
        total:         itemTotal,
      },
    });

    return this._recalculate(billId);
  }

  async removeItem(billId, itemId) {
    const item = await prisma.billItem.findFirst({ where: { id: itemId, billId } });
    if (!item) throw AppError.notFound('Bill item not found');
    await prisma.billItem.delete({ where: { id: itemId } });
    return this._recalculate(billId);
  }

  async finalize(id) {
    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) throw AppError.notFound('Bill not found');
    if (bill.status !== 'DRAFT') throw AppError.badRequest('Only draft bills can be finalized');

    return prisma.bill.update({
      where: { id },
      data:  { status: 'FINALIZED', finalizedAt: new Date() },
    });
  }

  async _recalculate(billId) {
    const items = await prisma.billItem.findMany({ where: { billId } });
    const subtotal = items.reduce((s, i) => s + parseFloat(i.total), 0);
    const bill     = await prisma.bill.findUnique({ where: { id: billId } });
    const total    = subtotal - parseFloat(bill.discount) + parseFloat(bill.tax);
    const paid     = parseFloat(bill.paidAmount);

    return prisma.bill.update({
      where: { id: billId },
      data:  { subtotal, total, dueAmount: Math.max(0, total - paid) },
      include: { items: true },
    });
  }
}

module.exports = new BillingService();
