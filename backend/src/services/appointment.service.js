const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

class AppointmentService {
  async getAll({ skip, limit, search, status, clinicType, doctorId, date }) {
    const where = {};
    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search } } },
        { patient: { lastName:  { contains: search } } },
        { patient: { patientId: { contains: search } } },
        { appointmentNo: { contains: search } },
      ];
    }
    if (status)     where.status     = status;
    if (clinicType) where.clinicType = clinicType;
    if (doctorId)   where.doctorId   = parseInt(doctorId);
    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0,0,0,0));
      const end   = new Date(d.setHours(23,59,59,999));
      where.scheduledAt = { gte: start, lte: end };
    }

    const [data, total] = await Promise.all([
      prisma.appointment.findMany({
        where, skip, take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: { select: { id:true, patientId:true, firstName:true, lastName:true, phone:true } },
          doctor:  { select: { id:true, firstName:true, lastName:true, jobTitle:true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor:  { select: { id:true, firstName:true, lastName:true, jobTitle:true } },
        visit:   true,
      },
    });
    if (!appt) throw AppError.notFound('Appointment not found');
    return appt;
  }

  async create(data, bookedById) {
    // Conflict check — doctor already booked at that time
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId:    parseInt(data.doctorId),
        scheduledAt: new Date(data.scheduledAt),
        status:      { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });
    if (conflict) throw AppError.conflict('Doctor already has an appointment at this time');

    return prisma.appointment.create({
      data: {
        appointmentNo: generateId('APT'),
        patientId:     parseInt(data.patientId),
        doctorId:      parseInt(data.doctorId),
        clinicType:    data.clinicType,
        scheduledAt:   new Date(data.scheduledAt),
        duration:      data.duration   || 15,
        reason:        data.reason     || null,
        notes:         data.notes      || null,
        bookedById,
      },
      include: {
        patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
        doctor:  { select: { id:true, firstName:true, lastName:true } },
      },
    });
  }

  async update(id, data) {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw AppError.notFound('Appointment not found');
    if (['COMPLETED','CANCELLED'].includes(appt.status)) {
      throw AppError.badRequest('Cannot modify a completed or cancelled appointment');
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        duration:    data.duration    || undefined,
        clinicType:  data.clinicType  || undefined,
        reason:      data.reason      || undefined,
        notes:       data.notes       || undefined,
      },
      include: {
        patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
        doctor:  { select: { id:true, firstName:true, lastName:true } },
      },
    });
  }

  async updateStatus(id, status) {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw AppError.notFound('Appointment not found');
    return prisma.appointment.update({ where: { id }, data: { status } });
  }

  async delete(id) {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw AppError.notFound('Appointment not found');
    return prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async getToday() {
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    return prisma.appointment.findMany({
      where: { scheduledAt: { gte: start, lte: end }, status: { notIn: ['CANCELLED'] } },
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id:true, patientId:true, firstName:true, lastName:true, phone:true } },
        doctor:  { select: { id:true, firstName:true, lastName:true } },
      },
    });
  }

  async getByDoctor(doctorId, { skip, limit }) {
    const [data, total] = await Promise.all([
      prisma.appointment.findMany({
        where: { doctorId }, skip, take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: { patient: { select: { id:true, patientId:true, firstName:true, lastName:true } } },
      }),
      prisma.appointment.count({ where: { doctorId } }),
    ]);
    return { data, total };
  }
}

module.exports = new AppointmentService();
