const { prisma }     = require('../config/database');
const AppError        = require('../utils/AppError');
const { generateId }  = require('../utils/helpers');
const { notify }      = require('./notification.service');

class PharmacyService {
  async create(data) {
    if (!data.visitId)        throw AppError.badRequest('Visit is required');
    if (!data.patientId)      throw AppError.badRequest('Patient is required');
    if (!data.items?.length)  throw AppError.badRequest('At least one drug is required');

    // doctorId may be null (admin user with no employee profile)
    // visitId must always be provided
    const doctorId  = data.doctorId ? parseInt(data.doctorId) : null;
    const visitId   = parseInt(data.visitId);
    const patientId = parseInt(data.patientId);

    // If no doctor, find the visit's doctor as fallback
    let resolvedDoctorId = doctorId;
    if (!resolvedDoctorId) {
      const visit = await prisma.visit.findUnique({ where: { id: visitId }, select: { doctorId: true } });
      resolvedDoctorId = visit?.doctorId || null;
    }

    if (!resolvedDoctorId) throw AppError.badRequest('Doctor is required. No doctor found for this visit.');

    return prisma.prescription.create({
      data: {
        prescriptionNo: generateId('RX'),
        visitId,
        patientId,
        doctorId:  resolvedDoctorId,
        notes:     data.notes || null,
        items: {
          create: data.items.map(item => ({
            drugId:       parseInt(item.drugId),
            dosage:       item.dosage,
            frequency:    item.frequency,
            duration:     item.duration,
            quantity:     parseInt(item.quantity) || 1,
            instructions: item.notes || null,  // schema uses 'instructions' not 'notes'
          })),
        },
      },
      include: {
        patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
        doctor:  { select: { id:true, firstName:true, lastName:true } },
        items:   { include: { drug: true } },
      },
    });
  }

  // Prescriptions
  async getAll({ skip, limit, search, status }) {
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { prescriptionNo: { contains: search } },
        { patient: { firstName: { contains: search } } },
        { patient: { patientId: { contains: search } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.prescription.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient:    { select: { id:true, patientId:true, firstName:true, lastName:true } },
          doctor:     { select: { id:true, firstName:true, lastName:true } },
          pharmacist: { select: { id:true, firstName:true, lastName:true } },
          items:      { include: { drug: true } },
        },
      }),
      prisma.prescription.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const rx = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient:    true,
        doctor:     { select: { id:true, firstName:true, lastName:true } },
        pharmacist: { select: { id:true, firstName:true, lastName:true } },
        items:      { include: { drug: true } },
      },
    });
    if (!rx) throw AppError.notFound('Prescription not found');
    return rx;
  }

  async dispense(id, pharmacistId) {
    const rx = await prisma.prescription.findUnique({
      where: { id }, include: { items: { include: { drug: { include: { stocks: true } } } } },
    });
    if (!rx) throw AppError.notFound('Prescription not found');
    if (rx.status === 'DISPENSED') throw AppError.conflict('Already dispensed');

    // Check stock availability for each item
    for (const item of rx.items) {
      const totalStock = item.drug.stocks.reduce((s, st) => s + st.quantity, 0);
      if (totalStock < item.quantity) {
        throw AppError.badRequest(`Insufficient stock for ${item.drug.genericName}`);
      }
    }

    // Deduct stock (FIFO — earliest expiry first)
    for (const item of rx.items) {
      let needed = item.quantity;
      const stocks = await prisma.drugStock.findMany({
        where: { drugId: item.drugId, quantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' },
      });

      for (const stock of stocks) {
        if (needed <= 0) break;
        const deduct = Math.min(stock.quantity, needed);
        await prisma.drugStock.update({
          where: { id: stock.id },
          data:  { quantity: stock.quantity - deduct },
        });
        await prisma.stockMovement.create({
          data: {
            stockId:       stock.id,
            type:          'OUT',
            quantity:      deduct,
            reference:     rx.prescriptionNo,
            reason:        'Dispensed to patient',
            performedById: pharmacistId,
          },
        });
        needed -= deduct;
      }

      // Update dispensed quantity
      await prisma.prescriptionItem.update({
        where: { id: item.id },
        data:  { dispensedQty: item.quantity },
      });
    }

    const dispensed = await prisma.prescription.update({
      where: { id },
      data: {
        status:       'DISPENSED',
        pharmacistId,
        dispensedAt:  new Date(),
      },
      include: {
        items:   { include: { drug: true } },
        patient: { select: { id:true, firstName:true, lastName:true } },
        visit:   { include: { doctor: { include: { user: true } } } },
      },
    });

    // Notify doctor that prescription was dispensed
    try {
      const doctorUserId = dispensed.visit?.doctor?.user?.id;
      if (doctorUserId) {
        const patientName = `${dispensed.patient?.firstName || ''} ${dispensed.patient?.lastName || ''}`.trim();
        await notify(doctorUserId, {
          title:   'Prescription Dispensed',
          message: `Medications for ${patientName || 'patient'} (${dispensed.prescriptionNo}) have been dispensed by pharmacy.`,
          type:    'SUCCESS',
          module:  'pharmacy',
          link:    `/pharmacy`,
        });
      }
    } catch (err) {
      console.error('Failed to notify doctor of dispense (non-fatal):', err.message);
    }

    return dispensed;
  }

  // Drugs catalog
  async getAllDrugs({ skip, limit, search, category }) {
    const where = { isActive: true };
    if (search)   where.OR = [{ genericName: { contains: search } }, { brandName: { contains: search } }, { drugCode: { contains: search } }];
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      prisma.drug.findMany({
        where, skip, take: limit,
        orderBy: { genericName: 'asc' },
        include: {
          _count: { select: { stocks: true } },
          stocks: { select: { quantity: true }, where: { quantity: { gt: 0 } } },
        },
      }),
      prisma.drug.count({ where }),
    ]);

    // Compute total stock per drug
    const enriched = data.map((d) => ({
      ...d,
      totalStock: d.stocks.reduce((s, st) => s + st.quantity, 0),
    }));

    return { data: enriched, total };
  }

  async createDrug(data) {
    const existing = await prisma.drug.findUnique({ where: { drugCode: data.drugCode } });
    if (existing) throw AppError.conflict('Drug code already exists');
    return prisma.drug.create({ data });
  }

  async updateDrug(id, data) {
    const drug = await prisma.drug.findUnique({ where: { id } });
    if (!drug) throw AppError.notFound('Drug not found');
    return prisma.drug.update({ where: { id }, data });
  }

  async getLowStock() {
    const drugs = await prisma.drug.findMany({
      where: { isActive: true },
      include: { stocks: { select: { quantity: true } } },
    });
    return drugs
      .map((d) => ({ ...d, totalStock: d.stocks.reduce((s, st) => s + st.quantity, 0) }))
      .filter((d) => d.totalStock <= d.reorderLevel);
  }

  async getExpiring(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return prisma.drugStock.findMany({
      where: { expiryDate: { lte: cutoff }, quantity: { gt: 0 } },
      include: { drug: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async addStock(data) {
    const drug = await prisma.drug.findUnique({ where: { id: parseInt(data.drugId) } });
    if (!drug) throw AppError.notFound('Drug not found');

    return prisma.drugStock.create({
      data: {
        drugId:        parseInt(data.drugId),
        batchNumber:   data.batchNumber,
        quantity:      parseInt(data.quantity),
        expiryDate:    new Date(data.expiryDate),
        purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
        notes:         data.notes || null,
      },
    });
  }
}

module.exports = new PharmacyService();
