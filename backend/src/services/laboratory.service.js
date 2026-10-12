const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');
const { notifyRoles, notify } = require('./notification.service');

class LaboratoryService {
  async getAll({ skip, limit, search, status, date }) {
    const where = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      where.createdAt = { gte: new Date(d.setHours(0,0,0,0)), lte: new Date(d.setHours(23,59,59,999)) };
    }
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { patient: { firstName: { contains: search } } },
        { patient: { lastName:  { contains: search } } },
        { patient: { patientId: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.labOrder.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient:   { select: { id:true, patientId:true, firstName:true, lastName:true } },
          doctor:    { select: { id:true, firstName:true, lastName:true } },
          technician:{ select: { id:true, firstName:true, lastName:true } },
          items:     { include: { test: true } },
        },
      }),
      prisma.labOrder.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const order = await prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient:    true,
        doctor:     { select: { id:true, firstName:true, lastName:true } },
        technician: { select: { id:true, firstName:true, lastName:true } },
        items:      { include: { test: true } },
        visit:      { select: { id:true, visitNo:true, diagnosis:true } },
      },
    });
    if (!order) throw AppError.notFound('Lab order not found');
    return order;
  }

  async create(data, doctorId) {
    // visitId is optional — lab orders can be created without an active visit
    let visitPatientId = data.patientId ? parseInt(data.patientId) : null;

    if (data.visitId) {
      const visit = await prisma.visit.findUnique({ where: { id: parseInt(data.visitId) } });
      if (!visit) throw AppError.notFound('Visit not found');
      visitPatientId = visit.patientId;
    }

    if (!visitPatientId) throw AppError.badRequest('Patient is required');

    const order = await prisma.labOrder.create({
      data: {
        orderNo:     generateId('LAB'),
        visitId:     data.visitId ? parseInt(data.visitId) : null,
        patientId:   visitPatientId,
        doctorId:    data.doctorId ? parseInt(data.doctorId) : (doctorId || null),
        urgency:     data.urgency      || 'ROUTINE',
        clinicalInfo:data.clinicalInfo || null,
        sampleType:  data.sampleType   || null,
        items: {
          create: (data.testIds || []).map((testId) => ({ testId: parseInt(testId) })),
        },
      },
      include: {
        patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
        items:   { include: { test: true } },
      },
    });

    // Update visit status only if a visit was linked
    if (data.visitId) {
      await prisma.visit.update({
        where: { id: parseInt(data.visitId) },
        data:  { status: 'PENDING_LAB' },
      });
    }

    return order;
  }

  async enterResults(id, results, technicianId) {
    const order = await prisma.labOrder.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw AppError.notFound('Lab order not found');

    // Update each result
    for (const result of results) {
      await prisma.labOrderItem.update({
        where: { id: parseInt(result.itemId) },
        data: {
          result:     result.result,
          unit:       result.unit       || undefined,
          normalRange:result.normalRange|| undefined,
          isAbnormal: result.isAbnormal === true || result.isAbnormal === 1 || result.isAbnormal === '1',
          remarks:    result.remarks    || undefined,
        },
      });
    }

    const updated = await prisma.labOrder.update({
      where: { id },
      data: {
        status:       'COMPLETED',
        technicianId,
        completedAt:  new Date(),
      },
      include: { items: { include: { test: true } } },
    });

    // Update visit status to PENDING_LAB so doctor knows results are being processed
    try {
      if (order.visitId) {
        await prisma.visit.updateMany({
          where: {
            id:     order.visitId,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
          data: { status: 'PENDING_LAB' },
        });
      }
    } catch (err) {
      console.error('Failed to update visit status after entering results (non-fatal):', err.message);
    }

    return updated;
  }

  async approve(id, approvedById) {
    const order = await prisma.labOrder.findUnique({ where: { id } });
    if (!order) throw AppError.notFound('Lab order not found');
    if (order.status !== 'COMPLETED') throw AppError.badRequest('Only completed orders can be approved');

    const approved = await prisma.labOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedById },
    });

    // ── Send results back to OPD ──────────────────────────────
    // If this order is linked to a visit that is PENDING_LAB,
    // check if ALL lab orders for that visit are now approved.
    // If yes → set visit status back to IN_PROGRESS so doctor sees results.
    try {
      if (order.visitId) {
        const pendingOrders = await prisma.labOrder.count({
          where: {
            visitId: order.visitId,
            status:  { notIn: ['APPROVED', 'REJECTED'] },
          },
        });

        if (pendingOrders === 0) {
          // All orders done — return visit to IN_PROGRESS
          await prisma.visit.updateMany({
            where: {
              id:     order.visitId,
              status: 'PENDING_LAB',
            },
            data: { status: 'IN_PROGRESS' },
          });
        }
      }
    } catch (err) {
      console.error('Failed to update visit status after lab approval (non-fatal):', err.message);
    }

    // Notify doctor that lab results are ready
    try {
      if (order.visitId) {
        const visit = await prisma.visit.findUnique({
          where: { id: order.visitId },
          include: { doctor: { include: { user: true } } },
        });
        if (visit?.doctor?.user?.id) {
          const patientName = `${approved.patient?.firstName || ''} ${approved.patient?.lastName || ''}`.trim();
          await notify(visit.doctor.user.id, {
            title:   'Lab Results Ready',
            message: `Lab results for ${patientName || 'patient'} (${approved.orderNo}) are approved and ready for review.`,
            type:    'SUCCESS',
            module:  'laboratory',
            link:    `/laboratory/${order.id}`,
          });
        }
      }
    } catch (err) {
      console.error('Failed to notify doctor of lab results (non-fatal):', err.message);
    }

    return approved;
  }

  // Lab test catalog
  async getAllTests({ skip, limit, search, category }) {
    const where = { isActive: true };
    if (search)   where.testName = { contains: search };
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      prisma.labTestCatalog.findMany({ where, skip, take: limit, orderBy: { category: 'asc' } }),
      prisma.labTestCatalog.count({ where }),
    ]);
    return { data, total };
  }

  async createTest(data) {
    const existing = await prisma.labTestCatalog.findUnique({ where: { testCode: data.testCode } });
    if (existing) throw AppError.conflict('Test code already exists');
    return prisma.labTestCatalog.create({ data });
  }
}

module.exports = new LaboratoryService();
