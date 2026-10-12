const { prisma } = require('../config/database');
const AppError   = require('../utils/AppError');

class LeaveService {
  async getAll({ skip, limit, status, employeeId }) {
    const where = {};
    if (status)     where.status     = status;
    if (employeeId) where.employeeId = parseInt(employeeId);

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee:  { select: { id:true, employeeNo:true, firstName:true, lastName:true, jobTitle:true } },
          leaveType: true,
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true, leaveType: true },
    });
    if (!leave) throw AppError.notFound('Leave request not found');
    return leave;
  }

  async create(data, employeeId) {
    const leaveType = await prisma.leaveType.findUnique({ where: { id: parseInt(data.leaveTypeId) } });
    if (!leaveType) throw AppError.notFound('Leave type not found');

    const start = new Date(data.startDate);
    const end   = new Date(data.endDate);
    if (end < start) throw AppError.badRequest('End date cannot be before start date');

    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check overlap
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status:    { notIn: ['REJECTED', 'CANCELLED'] },
        OR: [
          { startDate: { lte: end,   gte: start } },
          { endDate:   { lte: end,   gte: start } },
          { startDate: { lte: start }, endDate: { gte: end } },
        ],
      },
    });
    if (overlap) throw AppError.conflict('Leave dates overlap with an existing request');

    return prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: parseInt(data.leaveTypeId),
        startDate:   start,
        endDate:     end,
        totalDays,
        reason:      data.reason || null,
      },
      include: { leaveType: true, employee: { select: { id:true, firstName:true, lastName:true } } },
    });
  }

  async approve(id, approvedById) {
    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw AppError.notFound('Leave request not found');
    if (leave.status !== 'PENDING') throw AppError.badRequest('Only pending requests can be approved');

    // Mark attendance as ON_LEAVE for the days
    const current = new Date(leave.startDate);
    while (current <= leave.endDate) {
      const dateStr = new Date(current).toISOString().slice(0, 10);
      await prisma.$queryRawUnsafe(
        `INSERT INTO attendances (employee_id, date, status, created_at, updated_at)
         VALUES (?, ?, 'ON_LEAVE', NOW(), NOW())
         ON DUPLICATE KEY UPDATE status = 'ON_LEAVE', updated_at = NOW()`,
        leave.employeeId, dateStr
      );
      current.setDate(current.getDate() + 1);
    }

    return prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });
  }

  async reject(id, approvedById, rejectionNote) {
    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw AppError.notFound('Leave request not found');
    if (leave.status !== 'PENDING') throw AppError.badRequest('Only pending requests can be rejected');

    return prisma.leaveRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedById, approvedAt: new Date(), rejectionNote },
    });
  }

  async cancel(id, employeeId) {
    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw AppError.notFound('Leave request not found');
    if (leave.employeeId !== employeeId) throw AppError.forbidden('Cannot cancel another employee\'s leave');
    if (!['PENDING'].includes(leave.status)) throw AppError.badRequest('Only pending requests can be cancelled');

    return prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async getLeaveTypes() {
    return prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
  }
}

module.exports = new LeaveService();
