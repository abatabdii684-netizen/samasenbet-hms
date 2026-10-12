const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

const PATIENT_SELECT = {
  id: true, patientId: true, firstName: true, lastName: true,
  dateOfBirth: true, gender: true, bloodGroup: true, maritalStatus: true,
  nationalId: true, phone: true, email: true, address: true, city: true,
  emergencyContact: true, emergencyPhone: true, emergencyRelation: true,
  allergies: true, chronicDiseases: true, profilePhoto: true,
  isActive: true, createdAt: true, updatedAt: true,
};

class PatientService {
  async getAll({ skip, limit, search, gender, isActive }) {
    const where = {};

    if (search) {
      where.OR = [
        { firstName:  { contains: search } },
        { lastName:   { contains: search } },
        { patientId:  { contains: search } },
        { phone:      { contains: search } },
        { nationalId: { contains: search } },
      ];
    }
    if (gender)   where.gender   = gender;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        where, skip, take: limit,
        select: PATIENT_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id) {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        insurances: { include: { provider: true } },
        _count: { select: { visits: true, admissions: true, bills: true } },
      },
    });
    if (!patient) throw AppError.notFound('Patient not found');
    return patient;
  }

  async create(data, registeredById) {
    // Check duplicates
    if (data.nationalId) {
      const existing = await prisma.patient.findUnique({ where: { nationalId: data.nationalId } });
      if (existing) throw AppError.conflict(`National ID already registered (Patient: ${existing.patientId})`);
    }

    const patientId = generateId('PAT');

    return prisma.patient.create({
      data: {
        patientId,
        firstName:        data.firstName,
        lastName:         data.lastName,
        dateOfBirth:      new Date(data.dateOfBirth),
        gender:           data.gender,
        bloodGroup:       data.bloodGroup       || 'UNKNOWN',
        maritalStatus:    data.maritalStatus    || 'SINGLE',
        nationalId:       data.nationalId       || null,
        phone:            data.phone,
        email:            data.email            || null,
        address:          data.address          || null,
        city:             data.city             || null,
        emergencyContact: data.emergencyContact || null,
        emergencyPhone:   data.emergencyPhone   || null,
        emergencyRelation:data.emergencyRelation|| null,
        allergies:        data.allergies        || null,
        chronicDiseases:  data.chronicDiseases  || null,
        registeredById,
      },
      select: PATIENT_SELECT,
    });
  }

  async update(id, data) {
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) throw AppError.notFound('Patient not found');

    // National ID uniqueness check
    if (data.nationalId && data.nationalId !== patient.nationalId) {
      const dup = await prisma.patient.findUnique({ where: { nationalId: data.nationalId } });
      if (dup) throw AppError.conflict('National ID already used by another patient');
    }

    const updateData = {};
    const fields = ['firstName','lastName','dateOfBirth','gender','bloodGroup','maritalStatus',
      'nationalId','phone','email','address','city','emergencyContact','emergencyPhone',
      'emergencyRelation','allergies','chronicDiseases'];

    fields.forEach((f) => {
      if (data[f] !== undefined) {
        updateData[f] = f === 'dateOfBirth' ? new Date(data[f]) : data[f];
      }
    });

    return prisma.patient.update({ where: { id }, data: updateData, select: PATIENT_SELECT });
  }

  async delete(id) {
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) throw AppError.notFound('Patient not found');
    // Soft delete
    return prisma.patient.update({ where: { id }, data: { isActive: false } });
  }

  async getHistory(id) {
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) throw AppError.notFound('Patient not found');

    const [visits, admissions, labOrders, prescriptions] = await Promise.all([
      prisma.visit.findMany({
        where: { patientId: id },
        orderBy: { visitDate: 'desc' },
        take: 10,
        include: { doctor: { select: { firstName: true, lastName: true } } },
      }),
      prisma.admission.findMany({
        where: { patientId: id },
        orderBy: { admissionDate: 'desc' },
        take: 5,
        include: { ward: true, bed: true },
      }),
      prisma.labOrder.findMany({
        where: { patientId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: { include: { test: true } } },
      }),
      prisma.prescription.findMany({
        where: { patientId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: { include: { drug: true } } },
      }),
    ]);

    return { patient, visits, admissions, labOrders, prescriptions };
  }

  async getVisits(id, { skip, limit }) {
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) throw AppError.notFound('Patient not found');

    const [data, total] = await Promise.all([
      prisma.visit.findMany({
        where: { patientId: id },
        skip, take: limit,
        orderBy: { visitDate: 'desc' },
        include: { doctor: { select: { firstName: true, lastName: true } }, triage: true },
      }),
      prisma.visit.count({ where: { patientId: id } }),
    ]);
    return { data, total };
  }

  async getPrescriptions(id) {
    return prisma.prescription.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { drug: true } }, doctor: { select: { firstName: true, lastName: true } } },
    });
  }

  async getLabResults(id) {
    return prisma.labOrder.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { test: true } } },
    });
  }

  async getBilling(id) {
    return prisma.bill.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' },
      include: { items: true, payments: true },
    });
  }
}

module.exports = new PatientService();
