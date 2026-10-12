const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

const INCLUDE = {
  patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
  surgeon: { select: { id:true, firstName:true, lastName:true } },
  room:    true,
};

class OperationRoomService {
  async getAll({ skip = 0, limit = 20, status, date } = {}) {
    const where = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const n = new Date(d);    n.setDate(n.getDate() + 1);
      where.scheduledAt = { gte: d, lt: n };
    }
    const [data, total] = await Promise.all([
      prisma.operationSchedule.findMany({
        where, skip, take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: INCLUDE,
      }),
      prisma.operationSchedule.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const op = await prisma.operationSchedule.findUnique({
      where: { id },
      include: { patient: true, surgeon: true, room: true },
    });
    if (!op) throw AppError.notFound('Operation schedule not found');
    return op;
  }

  async create(data) {
    // visitId and surgeonId are optional — handle empty strings from frontend
    const visitId   = data.visitId   && data.visitId   !== '' ? parseInt(data.visitId)   : null;
    const surgeonId = data.surgeonId && data.surgeonId !== '' ? parseInt(data.surgeonId) : null;

    return prisma.operationSchedule.create({
      data: {
        scheduleNo:      generateId('OPR'),
        patientId:       parseInt(data.patientId),
        visitId,
        surgeonId,
        operationRoomId: parseInt(data.operationRoomId),
        operationType:   data.operationType,
        scheduledAt:     new Date(data.scheduledAt),
        duration:        parseInt(data.estimatedDuration) || 60,
        diagnosis:       data.preOpDiagnosis || null,
        preOpNotes:      data.notes          || null,
      },
      include: INCLUDE,
    });
  }

  async updateStatus(id, status, data = {}) {
    const op = await prisma.operationSchedule.findUnique({ where: { id } });
    if (!op) throw AppError.notFound('Not found');
    const updateData = { status };
    if (status === 'IN_PROGRESS') updateData.startedAt   = new Date();
    if (status === 'COMPLETED')   updateData.completedAt = new Date();
    if (data.postOpNotes)    updateData.postOpNotes   = data.postOpNotes;
    if (data.complications)  updateData.complications = data.complications;
    return prisma.operationSchedule.update({ where: { id }, data: updateData });
  }

  async getRooms() {
    return prisma.operationRoom.findMany({ orderBy: { name: 'asc' } });
  }

  async getTodaySchedule() {
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    return prisma.operationSchedule.findMany({
      where: { scheduledAt: { gte: start, lte: end } },
      orderBy: { scheduledAt: 'asc' },
      include: INCLUDE,
    });
  }
}

module.exports = new OperationRoomService();
