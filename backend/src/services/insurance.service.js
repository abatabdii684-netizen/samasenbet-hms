const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

class InsuranceService {

  // ── Providers ──────────────────────────────────────────────────
  async getProviders() {
    return prisma.insuranceProvider.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { patientInsurances: true } } },
    });
  }

  async createProvider(data) {
    const existing = await prisma.insuranceProvider.findUnique({ where: { code: data.code } });
    if (existing) throw AppError.conflict('Provider code already exists');
    return prisma.insuranceProvider.create({ data });
  }

  async updateProvider(id, data) {
    const p = await prisma.insuranceProvider.findUnique({ where: { id } });
    if (!p) throw AppError.notFound('Provider not found');
    return prisma.insuranceProvider.update({ where: { id }, data });
  }

  // ── Patient Insurance ─────────────────────────────────────────
  async getAll({ skip = 0, limit = 20, search, providerId, isActive } = {}) {
    const where = {};
    if (providerId) where.providerId = parseInt(providerId);
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
    if (search) {
      where.OR = [
        { policyNumber: { contains: search } },
        { memberNumber: { contains: search } },
        { patient: { firstName: { contains: search } } },
        { patient: { lastName:  { contains: search } } },
        { patient: { patientId: { contains: search } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.patientInsurance.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient:  { select: { id:true, patientId:true, firstName:true, lastName:true, phone:true } },
          provider: { select: { id:true, name:true, code:true } },
        },
      }),
      prisma.patientInsurance.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const ins = await prisma.patientInsurance.findUnique({
      where: { id },
      include: { patient: true, provider: true },
    });
    if (!ins) throw AppError.notFound('Insurance record not found');
    return ins;
  }

  async create(data) {
    return prisma.patientInsurance.create({
      data: {
        patientId:    parseInt(data.patientId),
        providerId:   parseInt(data.providerId),
        policyNumber: data.policyNumber,
        memberNumber: data.memberNumber   || null,
        coverageType: data.coverageType   || null,
        startDate:    data.startDate ? new Date(data.startDate) : null,
        endDate:      data.endDate   ? new Date(data.endDate)   : null,
        isActive:     data.isActive ?? true,
        notes:        data.notes || null,
      },
      include: { patient: true, provider: true },
    });
  }

  async update(id, data) {
    const ins = await prisma.patientInsurance.findUnique({ where: { id } });
    if (!ins) throw AppError.notFound('Insurance record not found');
    const updateData = {};
    if (data.policyNumber !== undefined) updateData.policyNumber = data.policyNumber;
    if (data.memberNumber !== undefined) updateData.memberNumber = data.memberNumber;
    if (data.coverageType !== undefined) updateData.coverageType = data.coverageType;
    if (data.startDate    !== undefined) updateData.startDate    = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate      !== undefined) updateData.endDate      = data.endDate   ? new Date(data.endDate)   : null;
    if (data.isActive     !== undefined) updateData.isActive     = data.isActive;
    if (data.notes        !== undefined) updateData.notes        = data.notes;
    return prisma.patientInsurance.update({ where: { id }, data: updateData, include: { patient: true, provider: true } });
  }

  async processClaim(id, claimData) {
    const ins = await prisma.patientInsurance.findUnique({ where: { id } });
    if (!ins) throw AppError.notFound('Insurance record not found');
    if (!ins.isActive) throw AppError.badRequest('Insurance policy is not active');
    // In real world this would create a claim record — for now just return the insurance with claim info
    return { insurance: ins, claim: { ...claimData, processedAt: new Date(), status: 'SUBMITTED' } };
  }
}

module.exports = new InsuranceService();
