const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

class AdmissionService {
  async getAll({ skip, limit, search, status, wardId }) {
    const where = {};
    if (status) where.status = status;
    if (wardId) where.wardId = parseInt(wardId);
    if (search) {
      where.OR = [
        { admissionNo: { contains: search } },
        { patient: { firstName: { contains: search } } },
        { patient: { patientId: { contains: search } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.admission.findMany({
        where, skip, take: limit,
        orderBy: { admissionDate: 'desc' },
        include: {
          patient: { select: { id:true, patientId:true, firstName:true, lastName:true, gender:true, phone:true } },
          ward:    { select: { id:true, name:true, code:true } },
          bed:     { select: { id:true, bedNumber:true } },
          doctor:  { select: { id:true, firstName:true, lastName:true } },
        },
      }),
      prisma.admission.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const admission = await prisma.admission.findUnique({
      where: { id },
      include: {
        patient: true, ward: true, bed: true,
        doctor:  { select: { id:true, firstName:true, lastName:true } },
        nursingNotes: { include: { nurse: { select: { id:true, firstName:true, lastName:true } } }, orderBy: { createdAt: 'desc' } },
        visit:   true,
      },
    });
    if (!admission) throw AppError.notFound('Admission not found');
    return admission;
  }

  async create(data, admittingDoctorId) {
    // Check bed availability
    const bed = await prisma.bed.findUnique({ where: { id: parseInt(data.bedId) } });
    if (!bed) throw AppError.notFound('Bed not found');
    if (bed.status !== 'AVAILABLE') throw AppError.conflict(`Bed ${bed.bedNumber} is not available`);

    // visitId is optional — patient may be admitted directly without an OPD visit
    const visitId = data.visitId ? parseInt(data.visitId) : null;

    const admission = await prisma.admission.create({
      data: {
        admissionNo:       generateId('ADM'),
        patientId:         parseInt(data.patientId),
        visitId,
        wardId:            parseInt(data.wardId),
        bedId:             parseInt(data.bedId),
        admittingDoctorId: admittingDoctorId || (data.admittingDoctorId ? parseInt(data.admittingDoctorId) : null),
        diagnosis:         data.diagnosis         || null,
        expectedDischarge: data.expectedDischarge ? new Date(data.expectedDischarge) : null,
      },
      include: {
        patient: { select: { id:true, patientId:true, firstName:true, lastName:true } },
        ward: true, bed: true,
      },
    });

    // Mark bed as occupied
    await prisma.bed.update({ where: { id: parseInt(data.bedId) }, data: { status: 'OCCUPIED' } });

    // Update visit status only if a visit was linked
    if (visitId) {
      await prisma.visit.update({ where: { id: visitId }, data: { status: 'ADMITTED' } });
    }

    return admission;
  }

  async discharge(id, data, dischargedById) {
    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) throw AppError.notFound('Admission not found');
    if (admission.status === 'DISCHARGED') throw AppError.conflict('Patient already discharged');

    await prisma.admission.update({
      where: { id },
      data: {
        status:          'DISCHARGED',
        dischargeNote:   data.dischargeNote || null,
        actualDischarge: new Date(),
        dischargedById,
      },
    });

    // Free bed
    await prisma.bed.update({ where: { id: admission.bedId }, data: { status: 'AVAILABLE' } });

    // Update visit status only if a visit was linked
    if (admission.visitId) {
      await prisma.visit.update({
        where: { id: admission.visitId },
        data:  { status: 'COMPLETED', dischargedAt: new Date(), dischargeNote: data.dischargeNote || null },
      });
    }

    return this.getById(id);
  }

  async transfer(id, data) {
    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) throw AppError.notFound('Admission not found');

    const newBed = await prisma.bed.findUnique({ where: { id: parseInt(data.newBedId) } });
    if (!newBed || newBed.status !== 'AVAILABLE') {
      throw AppError.conflict('Target bed is not available');
    }

    // Free old bed
    await prisma.bed.update({ where: { id: admission.bedId }, data: { status: 'AVAILABLE' } });

    // Occupy new bed
    await prisma.bed.update({ where: { id: parseInt(data.newBedId) }, data: { status: 'OCCUPIED' } });

    return prisma.admission.update({
      where: { id },
      data: { wardId: parseInt(data.newWardId), bedId: parseInt(data.newBedId) },
      include: { patient: true, ward: true, bed: true },
    });
  }

  async getActive() {
    return prisma.admission.findMany({
      where: { status: 'ACTIVE' },
      include: {
        patient: { select: { id:true, patientId:true, firstName:true, lastName:true, gender:true } },
        ward:    { select: { id:true, name:true, code:true } },
        bed:     { select: { id:true, bedNumber:true } },
        doctor:  { select: { id:true, firstName:true, lastName:true } },
      },
      orderBy: { admissionDate: 'desc' },
    });
  }
}

module.exports = new AdmissionService();
