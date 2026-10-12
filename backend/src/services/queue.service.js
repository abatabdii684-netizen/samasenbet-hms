const { prisma } = require('../config/database');

const PRIORITY_ORDER = { IMMEDIATE: 0, URGENT: 1, LESS_URGENT: 2, NON_URGENT: 3 };

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
};

const PATIENT_SELECT = {
  select: { id: true, patientId: true, firstName: true, lastName: true, phone: true },
};

class QueueService {

  async getActive() {
    return prisma.queue.findMany({
      where: {
        queueDate: todayRange(),
        status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
      },
      orderBy: [{ priority: 'asc' }, { tokenNumber: 'asc' }],
      include: { patient: PATIENT_SELECT },
    });
  }

  async getAll({ skip = 0, limit = 20, date, clinicType, status }) {
    const where = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const n = new Date(d);
      n.setDate(n.getDate() + 1);
      where.queueDate = { gte: d, lt: n };
    }
    if (clinicType) where.clinicType = clinicType;
    if (status)     where.status     = status;

    const [data, total] = await Promise.all([
      prisma.queue.findMany({
        where, skip, take: limit,
        orderBy: [{ queueDate: 'desc' }, { tokenNumber: 'asc' }],
        include: { patient: PATIENT_SELECT },
      }),
      prisma.queue.count({ where }),
    ]);
    return { data, total };
  }

  async create(data) {
    const range = todayRange();
    const last  = await prisma.queue.findFirst({
      where: { clinicType: data.clinicType, queueDate: range },
      orderBy: { tokenNumber: 'desc' },
    });
    const tokenNumber = (last?.tokenNumber ?? 0) + 1;

    return prisma.queue.create({
      data: {
        patientId:   parseInt(data.patientId),
        clinicType:  data.clinicType,
        priority:    data.priority || 'NON_URGENT',
        tokenNumber,
        visitId:     data.visitId ? parseInt(data.visitId) : null,
      },
      include: { patient: PATIENT_SELECT },
    });
  }

  async callNext(clinicType) {
    const range = todayRange();

    // Complete any current IN_PROGRESS
    await prisma.queue.updateMany({
      where: { clinicType, status: 'IN_PROGRESS', queueDate: range },
      data:  { status: 'COMPLETED', completedAt: new Date() },
    });

    // Get all waiting, sort by priority then token
    const waiting = await prisma.queue.findMany({
      where: { clinicType, status: 'WAITING', queueDate: range },
      include: { patient: PATIENT_SELECT },
    });
    if (!waiting.length) return null;

    waiting.sort((a, b) => {
      const diff = (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
      return diff !== 0 ? diff : a.tokenNumber - b.tokenNumber;
    });

    return prisma.queue.update({
      where: { id: waiting[0].id },
      data:  { status: 'IN_PROGRESS', calledAt: new Date() },
      include: { patient: PATIENT_SELECT },
    });
  }

  async updateStatus(id, status) {
    const data = { status };
    if (status === 'COMPLETED') data.completedAt = new Date();
    if (status === 'CALLED')    data.calledAt    = new Date();
    return prisma.queue.update({ where: { id }, data });
  }

  async getStats(clinicType) {
    const range = todayRange();
    const base  = { queueDate: range, ...(clinicType ? { clinicType } : {}) };

    const [waiting, inProgress, completed, skipped] = await Promise.all([
      prisma.queue.count({ where: { ...base, status: 'WAITING'     } }),
      prisma.queue.count({ where: { ...base, status: 'IN_PROGRESS' } }),
      prisma.queue.count({ where: { ...base, status: 'COMPLETED'   } }),
      prisma.queue.count({ where: { ...base, status: 'SKIPPED'     } }),
    ]);
    return { waiting, inProgress, completed, skipped, total: waiting + inProgress + completed + skipped };
  }
}

module.exports = new QueueService();
