const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

class PaymentService {
  async getAll({ skip, limit, search, method, status }) {
    const where = {};
    if (method) where.method = method;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { paymentNo: { contains: search } },
        { bill: { billNo: { contains: search } } },
        { bill: { patient: { firstName: { contains: search } } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where, skip, take: limit,
        orderBy: { paidAt: 'desc' },
        include: { bill: { include: { patient: { select: { id:true, patientId:true, firstName:true, lastName:true } } } } },
      }),
      prisma.payment.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { bill: { include: { patient: true, items: true } } },
    });
    if (!payment) throw AppError.notFound('Payment not found');
    return payment;
  }

  async create(data, receivedById) {
    const bill = await prisma.bill.findUnique({ where: { id: parseInt(data.billId) } });
    if (!bill) throw AppError.notFound('Bill not found');
    if (bill.status === 'CANCELLED') throw AppError.badRequest('Cannot pay a cancelled bill');
    if (bill.status === 'PAID')      throw AppError.badRequest('Bill is already fully paid');

    const amount = parseFloat(data.amount);
    if (amount <= 0) throw AppError.badRequest('Payment amount must be positive');
    if (amount > parseFloat(bill.dueAmount)) {
      throw AppError.badRequest(`Payment amount (${amount}) exceeds due amount (${bill.dueAmount})`);
    }

    const payment = await prisma.payment.create({
      data: {
        paymentNo:   generateId('PAY'),
        billId:      parseInt(data.billId),
        amount,
        method:      data.method    || 'CASH',
        status:      'COMPLETED',
        reference:   data.reference || null,
        notes:       data.notes     || null,
        receivedById,
        paidAt:      new Date(),
      },
    });

    // Update bill totals
    const newPaid = parseFloat(bill.paidAmount) + amount;
    const newDue  = Math.max(0, parseFloat(bill.total) - newPaid);
    const newStatus = newDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

    await prisma.bill.update({
      where: { id: parseInt(data.billId) },
      data:  { paidAmount: newPaid, dueAmount: newDue, status: newStatus },
    });

    return payment;
  }

  async refund(id, reason) {
    const payment = await prisma.payment.findUnique({
      where: { id }, include: { bill: true },
    });
    if (!payment) throw AppError.notFound('Payment not found');
    if (payment.status === 'REFUNDED') throw AppError.conflict('Already refunded');

    await prisma.payment.update({ where: { id }, data: { status: 'REFUNDED' } });

    // Update bill amounts
    const bill = payment.bill;
    const newPaid = Math.max(0, parseFloat(bill.paidAmount) - parseFloat(payment.amount));
    const newDue  = parseFloat(bill.total) - newPaid;

    await prisma.bill.update({
      where: { id: bill.id },
      data:  { paidAmount: newPaid, dueAmount: newDue, status: newPaid > 0 ? 'PARTIALLY_PAID' : 'FINALIZED' },
    });

    return prisma.payment.findUnique({ where: { id }, include: { bill: true } });
  }
}

module.exports = new PaymentService();
