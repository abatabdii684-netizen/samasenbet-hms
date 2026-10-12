const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

const INCLUDE = {
  patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
  doctor:  { select: { id:true, firstName:true, lastName:true } },
  nurse:   { select: { id:true, firstName:true, lastName:true } },
};

class DeliveryService {
  async getAll({ skip = 0, limit = 20, status, date } = {}) {
    const where = {};
    // DeliveryRecord has no status field — filter by motherCondition if provided
    if (status) where.motherCondition = status;
    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const n = new Date(d);    n.setDate(n.getDate() + 1);
      where.deliveryDate = { gte: d, lt: n };
    }
    const [data, total] = await Promise.all([
      prisma.deliveryRecord.findMany({
        where, skip, take: limit,
        orderBy: { deliveryDate: 'desc' },
        include: INCLUDE,
      }),
      prisma.deliveryRecord.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const rec = await prisma.deliveryRecord.findUnique({
      where: { id },
      include: { patient: true, doctor: true, nurse: true },
    });
    if (!rec) throw AppError.notFound('Delivery record not found');
    return rec;
  }

  async create(data, createdById) {
    return prisma.deliveryRecord.create({
      data: {
        deliveryNo:        generateId('DLV'),
        patientId:         parseInt(data.patientId),
        visitId:           data.visitId ? parseInt(data.visitId) : 1, // required field fallback
        attendingDoctorId: data.attendingDoctorId ? parseInt(data.attendingDoctorId) : null,
        attendingNurseId:  data.attendingNurseId  ? parseInt(data.attendingNurseId)  : null,
        deliveryType:      data.deliveryType  || 'NORMAL',
        deliveryDate:      new Date(data.deliveryDate || Date.now()),
        gestationWeeks:    data.gestationalAge  ? parseInt(data.gestationalAge)  : null,
        babyWeight:        data.babyWeight      ? parseFloat(data.babyWeight)    : null,
        babyGender:        data.babySex         || null,
        apgarScore:        data.apgarScore      ? parseInt(data.apgarScore)      : null,
        motherCondition:   data.motherStatus    || 'STABLE',
        babyCondition:     data.babyStatus      || 'ALIVE',
        complications:     data.complications   || null,
        notes:             data.notes           || null,
      },
      include: INCLUDE,
    });
  }

  async update(id, data) {
    const rec = await prisma.deliveryRecord.findUnique({ where: { id } });
    if (!rec) throw AppError.notFound('Delivery record not found');
    const updateData = {};
    if (data.deliveryType)    updateData.deliveryType    = data.deliveryType;
    if (data.motherStatus)    updateData.motherCondition = data.motherStatus;
    if (data.babyStatus)      updateData.babyCondition   = data.babyStatus;
    if (data.complications)   updateData.complications   = data.complications;
    if (data.notes)           updateData.notes           = data.notes;
    if (data.apgarScore)      updateData.apgarScore      = parseInt(data.apgarScore);
    if (data.babyWeight)      updateData.babyWeight      = parseFloat(data.babyWeight);
    return prisma.deliveryRecord.update({ where: { id }, data: updateData, include: INCLUDE });
  }
}

module.exports = new DeliveryService();
