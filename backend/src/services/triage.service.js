const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');
const { notifyRoles } = require('./notification.service');

class TriageService {
  async getAll({ skip, limit, search, priority, date }) {
    const where = {};
    if (priority) where.priority = priority;
    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lte: next };
    }
    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search } } },
        { patient: { lastName:  { contains: search } } },
        { patient: { patientId: { contains: search } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.triage.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id:true, patientId:true, firstName:true, lastName:true, gender:true, dateOfBirth:true } },
          nurse:   { select: { id:true, firstName:true, lastName:true } },
          visit:   { select: { id:true, visitNo:true, status:true } },
        },
      }),
      prisma.triage.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const triage = await prisma.triage.findUnique({
      where: { id },
      include: {
        patient: true,
        nurse:   { select: { id:true, firstName:true, lastName:true } },
        visit:   true,
      },
    });
    if (!triage) throw AppError.notFound('Triage record not found');
    return triage;
  }

  async create(data, nurseId) {
    // Verify visit exists
    const visit = await prisma.visit.findUnique({ where: { id: parseInt(data.visitId) } });
    if (!visit) throw AppError.notFound('Visit not found');

    // Check if triage already done for this visit
    const existing = await prisma.triage.findUnique({ where: { visitId: parseInt(data.visitId) } });
    if (existing) throw AppError.conflict('Triage already recorded for this visit. Update the existing record.');

    // Auto-calculate BMI
    let bmi = null;
    if (data.weight && data.height) {
      const heightM = parseFloat(data.height) / 100;
      bmi = (parseFloat(data.weight) / (heightM * heightM)).toFixed(2);
    }

    // nurseId is required — fall back to the visit's doctor if no nurse resolved
    let resolvedNurseId = nurseId;
    if (!resolvedNurseId) {
      resolvedNurseId = visit.doctorId; // use doctor as fallback
    }
    if (!resolvedNurseId) throw AppError.badRequest('No nurse/employee profile found. Please link your user account to an employee record.');

    const triage = await prisma.triage.create({
      data: {
        visitId:               parseInt(data.visitId),
        patientId:             parseInt(data.patientId),
        nurseId:               resolvedNurseId,
        temperature:           data.temperature           ? parseFloat(data.temperature)  : null,
        bloodPressureSystolic: data.bloodPressureSystolic ? parseInt(data.bloodPressureSystolic)  : null,
        bloodPressureDiastolic:data.bloodPressureDiastolic? parseInt(data.bloodPressureDiastolic) : null,
        pulseRate:             data.pulseRate             ? parseInt(data.pulseRate)       : null,
        respiratoryRate:       data.respiratoryRate       ? parseInt(data.respiratoryRate) : null,
        oxygenSaturation:      data.oxygenSaturation      ? parseFloat(data.oxygenSaturation) : null,
        weight:                data.weight                ? parseFloat(data.weight)        : null,
        height:                data.height                ? parseFloat(data.height)        : null,
        bmi:                   bmi ? parseFloat(bmi)      : null,
        chiefComplaint:        data.chiefComplaint        || null,
        priority:              data.priority              || 'NON_URGENT',
        notes:                 data.notes                 || null,
      },
      include: {
        patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
        nurse:   { select: { id:true, firstName:true, lastName:true } },
      },
    });

    // ── Notify for high-priority triage ──────────────────────────
    const priority = data.priority || 'NON_URGENT';
    if (priority === 'IMMEDIATE' || priority === 'URGENT') {
      const patientName = `${triage.patient?.firstName || ''} ${triage.patient?.lastName || ''}`.trim();
      await notifyRoles(
        ['CEO','ADMIN_FINANCE','MEDICAL_DIRECTOR','MEDICAL_SUPERVISOR','DOCTOR','OPD_HEAD','MATRON'],
        {
          title:   `⚠ ${priority} Triage — ${patientName}`,
          message: `Patient ${patientName} has been triaged as ${priority}. Immediate attention required.`,
          type:    priority === 'IMMEDIATE' ? 'ALERT' : 'WARNING',
          module:  'triage',
          link:    `/triage`,
        }
      );
    }

    // ── Auto-create consultation bill ─────────────────────────────
    // Only create if no bill exists for this visit yet
    try {
      const existingBill = await prisma.bill.findFirst({
        where: { visitId: parseInt(data.visitId) },
      });

      if (!existingBill) {
        // Find OPD consultation service type
        let serviceType = await prisma.billServiceType.findFirst({
          where: {
            OR: [
              { name: { contains: 'OPD' } },
              { name: { contains: 'Consultation' } },
              { name: { contains: 'consultation' } },
            ],
          },
        });

        // Determine price based on patient type
        const patientType  = visit.patientType || 'OPD';
        let   description  = 'OPD Consultation Fee';
        let   unitPrice    = 150; // default

        if (patientType === 'EMERGENCY') {
          description = 'Emergency Consultation Fee';
          unitPrice   = 500;
          serviceType = await prisma.billServiceType.findFirst({
            where: { name: { contains: 'Emergency' } },
          }) || serviceType;
        } else if (patientType === 'IPD') {
          description = 'Specialist Consultation Fee';
          unitPrice   = 300;
          serviceType = await prisma.billServiceType.findFirst({
            where: { name: { contains: 'Specialist' } },
          }) || serviceType;
        }

        if (serviceType) unitPrice = parseFloat(serviceType.price);

        await prisma.bill.create({
          data: {
            billNo:      generateId('BLL'),
            patientId:   parseInt(data.patientId),
            visitId:     parseInt(data.visitId),
            subtotal:    unitPrice,
            discount:    0,
            tax:         0,
            total:       unitPrice,
            dueAmount:   unitPrice,
            status:      'FINALIZED',
            finalizedAt: new Date(),
            items: {
              create: [{
                serviceTypeId: serviceType?.id || null,
                description,
                quantity:  1,
                unitPrice,
                discount:  0,
                total:     unitPrice,
              }],
            },
          },
        });
      }
    } catch (billingErr) {
      // Billing failure should NOT block triage creation — log and continue
      console.error('Auto-billing after triage failed (non-fatal):', billingErr.message);
    }

    return triage;
  }

  async update(id, data) {
    const triage = await prisma.triage.findUnique({ where: { id } });
    if (!triage) throw AppError.notFound('Triage record not found');

    let bmi = triage.bmi;
    if (data.weight && data.height) {
      const heightM = parseFloat(data.height) / 100;
      bmi = parseFloat((parseFloat(data.weight) / (heightM * heightM)).toFixed(2));
    }

    return prisma.triage.update({
      where: { id },
      data: {
        temperature:            data.temperature            !== undefined ? parseFloat(data.temperature)   : undefined,
        bloodPressureSystolic:  data.bloodPressureSystolic  !== undefined ? parseInt(data.bloodPressureSystolic)  : undefined,
        bloodPressureDiastolic: data.bloodPressureDiastolic !== undefined ? parseInt(data.bloodPressureDiastolic) : undefined,
        pulseRate:              data.pulseRate              !== undefined ? parseInt(data.pulseRate)        : undefined,
        respiratoryRate:        data.respiratoryRate        !== undefined ? parseInt(data.respiratoryRate)  : undefined,
        oxygenSaturation:       data.oxygenSaturation       !== undefined ? parseFloat(data.oxygenSaturation) : undefined,
        weight:                 data.weight                 !== undefined ? parseFloat(data.weight)         : undefined,
        height:                 data.height                 !== undefined ? parseFloat(data.height)         : undefined,
        bmi,
        chiefComplaint: data.chiefComplaint || undefined,
        priority:       data.priority       || undefined,
        notes:          data.notes          || undefined,
      },
    });
  }
}

module.exports = new TriageService();
