const { prisma } = require('../config/database');
const AppError   = require('../utils/AppError');

class AttendanceService {
  async getAll({ skip, limit, search, date, employeeId }) {
    const where = {};
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    if (search) {
      where.OR = [
        { employee: { firstName: { contains: search } } },
        { employee: { lastName:  { contains: search } } },
        { employee: { employeeNo:{ contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where, skip, take: limit,
        orderBy: [{ date: 'desc' }, { employee: { firstName: 'asc' } }],
        include: { employee: { select: { id:true, employeeNo:true, firstName:true, lastName:true, department:{ select:{ name:true } } } } },
      }),
      prisma.attendance.count({ where }),
    ]);
    return { data, total };
  }

  async getToday() {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    return prisma.attendance.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: { employee: { select: { id:true, employeeNo:true, firstName:true, lastName:true, jobTitle:true } } },
      orderBy: { checkIn: 'asc' },
    });
  }

  async checkIn(employeeId, recordedById) {
    const todayStr = new Date().toISOString().slice(0, 10); // "2026-08-14"

    // Use raw query to match DATE column correctly
    const existing = await prisma.$queryRawUnsafe(
      `SELECT * FROM attendances WHERE employee_id = ? AND DATE(date) = ? LIMIT 1`,
      employeeId, todayStr
    );
    const record = existing[0] || null;

    if (record && record.check_in) throw AppError.conflict('Already checked in today');

    const now = new Date();
    const isLate = now.getHours() >= 9 && now.getMinutes() > 15;
    const status = isLate ? 'LATE' : 'PRESENT';

    if (record) {
      return prisma.attendance.update({
        where: { id: record.id },
        data: { checkIn: now, status },
      });
    }

    // Use raw insert to avoid date serialization issues
    await prisma.$queryRawUnsafe(
      `INSERT INTO attendances (employee_id, date, check_in, status, recorded_by_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      employeeId, todayStr, now, status, recordedById || null
    );
    const created = await prisma.$queryRawUnsafe(
      `SELECT * FROM attendances WHERE employee_id = ? AND DATE(date) = ? LIMIT 1`,
      employeeId, todayStr
    );
    return created[0];
  }

  async checkOut(employeeId) {
    const todayStr = new Date().toISOString().slice(0, 10);

    const existing = await prisma.$queryRawUnsafe(
      `SELECT * FROM attendances WHERE employee_id = ? AND DATE(date) = ? LIMIT 1`,
      employeeId, todayStr
    );
    const record = existing[0] || null;

    if (!record) throw AppError.badRequest('No check-in found for today');
    if (record.check_out) throw AppError.conflict('Already checked out');

    const now = new Date();
    const workHours = parseFloat(((now - new Date(record.check_in)) / (1000 * 60 * 60)).toFixed(2));
    const overtime  = Math.max(0, parseFloat((workHours - 8).toFixed(2)));

    return prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: now, workHours, overtime },
    });
  }

  async update(id, data) {
    const record = await prisma.attendance.findUnique({ where: { id } });
    if (!record) throw AppError.notFound('Attendance record not found');
    return prisma.attendance.update({ where: { id }, data });
  }

  async getSummary({ employeeId, month, year }) {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const records = await prisma.attendance.findMany({
      where: { employeeId: parseInt(employeeId), date: { gte: start, lte: end } },
    });

    const summary = {
      present:   records.filter((r) => r.status === 'PRESENT').length,
      absent:    records.filter((r) => r.status === 'ABSENT').length,
      late:      records.filter((r) => r.status === 'LATE').length,
      halfDay:   records.filter((r) => r.status === 'HALF_DAY').length,
      onLeave:   records.filter((r) => r.status === 'ON_LEAVE').length,
      totalWork: records.reduce((s, r) => s + (parseFloat(r.workHours) || 0), 0).toFixed(2),
      overtime:  records.reduce((s, r) => s + (parseFloat(r.overtime)  || 0), 0).toFixed(2),
    };
    return { summary, records };
  }
}

module.exports = new AttendanceService();
