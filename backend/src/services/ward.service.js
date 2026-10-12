const { prisma } = require('../config/database');
const AppError   = require('../utils/AppError');

class WardService {
  async getAll({ skip = 0, limit = 50, search } = {}) {
    const where = {};
    if (search) where.OR = [{ name: { contains: search } }, { code: { contains: search } }];
    const [data, total] = await Promise.all([
      prisma.ward.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { beds: true } },
          beds:   { select: { status: true } },
        },
      }),
      prisma.ward.count({ where }),
    ]);
    const enriched = data.map(w => ({
      ...w,
      totalBeds:     w.beds.length,
      availableBeds: w.beds.filter(b => b.status === 'AVAILABLE').length,
      occupiedBeds:  w.beds.filter(b => b.status === 'OCCUPIED').length,
    }));
    return { data: enriched, total };
  }

  async getById(id) {
    const ward = await prisma.ward.findUnique({
      where: { id },
      include: {
        beds: {
          orderBy: { bedNumber: 'asc' },
          include: {
            admissions: {
              where:   { status: 'ACTIVE' },
              take:    1,
              include: { patient: { select: { id:true, patientId:true, firstName:true, lastName:true, gender:true } } },
            },
          },
        },
      },
    });
    if (!ward) throw AppError.notFound('Ward not found');
    // normalise: expose first active admission as currentAdmission for frontend compatibility
    ward.beds = ward.beds.map(b => ({
      ...b,
      currentAdmission: b.admissions?.[0] ?? null,
    }));
    return ward;
  }

  async create(data) {
    const existing = await prisma.ward.findUnique({ where: { code: data.code } });
    if (existing) throw AppError.conflict('Ward code already exists');
    return prisma.ward.create({ data });
  }

  async update(id, data) {
    const ward = await prisma.ward.findUnique({ where: { id } });
    if (!ward) throw AppError.notFound('Ward not found');
    return prisma.ward.update({ where: { id }, data });
  }
}

class BedService {
  async getAll({ skip = 0, limit = 100, wardId, status } = {}) {
    const where = {};
    if (wardId) where.wardId = parseInt(wardId);
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      prisma.bed.findMany({
        where, skip, take: limit,
        orderBy: [{ wardId: 'asc' }, { bedNumber: 'asc' }],
        include: {
          ward: { select: { id:true, name:true, code:true } },
          admissions: {
            where:   { status: 'ACTIVE' },
            take:    1,
            include: { patient: { select: { id:true, patientId:true, firstName:true, lastName:true } } },
          },
        },
      }).then(beds => beds.map(b => ({ ...b, currentAdmission: b.admissions?.[0] ?? null }))),
      prisma.bed.count({ where }),
    ]);
    return { data, total };
  }

  async getAvailable(wardId) {
    const where = { status: 'AVAILABLE' };
    if (wardId) where.wardId = parseInt(wardId);
    return prisma.bed.findMany({
      where,
      orderBy: [{ wardId: 'asc' }, { bedNumber: 'asc' }],
      include: { ward: { select: { id:true, name:true, code:true } } },
    });
  }

  async create(data) {
    return prisma.bed.create({
      data: {
        wardId:    parseInt(data.wardId),
        bedNumber: data.bedNumber,
        type:      data.type   || 'GENERAL',
        status:    data.status || 'AVAILABLE',
        notes:     data.notes  || null,
      },
      include: { ward: { select: { id:true, name:true, code:true } } },
    });
  }

  async update(id, data) {
    const bed = await prisma.bed.findUnique({ where: { id } });
    if (!bed) throw AppError.notFound('Bed not found');
    return prisma.bed.update({ where: { id }, data, include: { ward: { select: { id:true, name:true } } } });
  }

  async updateStatus(id, status) {
    const bed = await prisma.bed.findUnique({ where: { id } });
    if (!bed) throw AppError.notFound('Bed not found');
    if (bed.status === 'OCCUPIED' && status !== 'MAINTENANCE') {
      throw AppError.badRequest('Cannot change status of an occupied bed');
    }
    return prisma.bed.update({ where: { id }, data: { status } });
  }
}

module.exports = { WardService: new WardService(), BedService: new BedService() };
