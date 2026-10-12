const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

class OpdService {
  async getAll({ skip, limit, search, status, clinicType, doctorId, patientId, date }) {
    const where = {};
    if (status)     where.status     = status;
    if (clinicType) where.clinicType = clinicType;
    if (doctorId)   where.doctorId   = parseInt(doctorId);
    if (patientId)  where.patientId  = parseInt(patientId);
    if (date) {
      const d = new Date(date);
      where.visitDate = { gte: new Date(d.setHours(0,0,0,0)), lte: new Date(d.setHours(23,59,59,999)) };
    }
    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search } } },
        { patient: { lastName:  { contains: search } } },
        { patient: { patientId: { contains: search } } },
        { visitNo: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.visit.findMany({
        where, skip, take: limit,
        orderBy: { visitDate: 'desc' },
        include: {
          patient: { select: { id:true, patientId:true, firstName:true, lastName:true, gender:true, dateOfBirth:true } },
          doctor:  { select: { id:true, firstName:true, lastName:true, jobTitle:true } },
          triage:  true,
          _count:  { select: { labOrders: true, prescriptions: true } },
        },
      }),
      prisma.visit.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        patient:      true,
        doctor:       { select: { id:true, firstName:true, lastName:true, jobTitle:true } },
        triage:       true,
        labOrders:    { include: { items: { include: { test: true } } } },
        prescriptions:{ include: { items: { include: { drug: true } } } },
        admission:    { include: { ward: true, bed: true } },
        bill:         true,
      },
    });
    if (!visit) throw AppError.notFound('Visit not found');
    return visit;
  }

  async create(data, doctorId) {
    if (!doctorId) throw AppError.badRequest('Doctor ID is required to create a visit');
    const visitNo = generateId('VIS');

    return prisma.visit.create({
      data: {
        visitNo,
        patientId:      parseInt(data.patientId),
        doctorId:       parseInt(doctorId),
        appointmentId:  data.appointmentId ? parseInt(data.appointmentId) : null,
        clinicType:     data.clinicType    || 'GENERAL_OPD',
        patientType:    data.patientType   || 'OPD',
        chiefComplaint: data.chiefComplaint|| null,
      },
      include: {
        patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
        doctor:  { select: { id:true, firstName:true, lastName:true } },
      },
    });
  }

  async diagnose(id, data) {
    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) throw AppError.notFound('Visit not found');

    return prisma.visit.update({
      where: { id },
      data: {
        chiefComplaint:  data.chiefComplaint  || undefined,
        presentIllness:  data.presentIllness  || undefined,
        pastHistory:     data.pastHistory     || undefined,
        physicalExam:    data.physicalExam    || undefined,
        diagnosis:       data.diagnosis       || undefined,
        icdCode:         data.icdCode         || undefined,
        treatment:       data.treatment       || undefined,
        followUpDate:    data.followUpDate    ? new Date(data.followUpDate) : undefined,
        referredTo:      data.referredTo      || undefined,
        status:          data.status          || 'IN_PROGRESS',
      },
    });
  }

  async discharge(id, data) {
    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) throw AppError.notFound('Visit not found');

    return prisma.visit.update({
      where: { id },
      data: {
        dischargeNote: data.dischargeNote || null,
        dischargedAt:  new Date(),
        status:        'COMPLETED',
      },
    });
  }

  async getByClinic(clinicType, { skip, limit }) {
    const [data, total] = await Promise.all([
      prisma.visit.findMany({
        where: { clinicType, status: { notIn: ['COMPLETED'] } },
        skip, take: limit,
        orderBy: { visitDate: 'asc' },
        include: {
          patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
          triage:  true,
        },
      }),
      prisma.visit.count({ where: { clinicType, status: { notIn: ['COMPLETED'] } } }),
    ]);
    return { data, total };
  }
}

module.exports = new OpdService();
