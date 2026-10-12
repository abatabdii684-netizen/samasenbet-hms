const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

const EMP_SELECT = {
  id:true, employeeNo:true, firstName:true, lastName:true, gender:true,
  dateOfBirth:true, nationalId:true, phone:true, email:true, address:true,
  jobTitle:true, specialization:true, employmentType:true, status:true,
  hireDate:true, basicSalary:true, profilePhoto:true, licenseNumber:true,
  qualifications:true, emergencyContact:true, emergencyPhone:true,
  bankName:true, bankAccount:true, createdAt:true, updatedAt:true,
};

class EmployeeService {
  async getAll({ skip, limit, search, departmentId, status, employmentType }) {
    const where = {};
    if (departmentId)   where.departmentId   = parseInt(departmentId);
    if (status)         where.status         = status;
    if (employmentType) where.employmentType = employmentType;
    if (search) {
      where.OR = [
        { firstName:  { contains: search } },
        { lastName:   { contains: search } },
        { employeeNo: { contains: search } },
        { phone:      { contains: search } },
        { jobTitle:   { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where, skip, take: limit,
        orderBy: { firstName: 'asc' },
        select: {
          ...EMP_SELECT,
          department: { select: { id:true, name:true, code:true } },
          user:       { select: { id:true, username:true, email:true, isActive:true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const emp = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        user:       { select: { id:true, username:true, email:true, isActive:true, role: true } },
        _count: { select: { attendances:true, leaveRequests:true, payrolls:true } },
      },
    });
    if (!emp) throw AppError.notFound('Employee not found');
    return emp;
  }

  async create(data) {
    // Duplicate checks
    if (data.nationalId) {
      const dup = await prisma.employee.findUnique({ where: { nationalId: data.nationalId } });
      if (dup) throw AppError.conflict('National ID already registered');
    }

    return prisma.employee.create({
      data: {
        employeeNo:      generateId('EMP'),
        firstName:       data.firstName,
        lastName:        data.lastName,
        gender:          data.gender,
        dateOfBirth:     new Date(data.dateOfBirth),
        nationalId:      data.nationalId      || null,
        phone:           data.phone,
        email:           data.email           || null,
        address:         data.address         || null,
        departmentId:    parseInt(data.departmentId),
        jobTitle:        data.jobTitle,
        specialization:  data.specialization  || null,
        employmentType:  data.employmentType  || 'FULL_TIME',
        hireDate:        new Date(data.hireDate),
        basicSalary:     parseFloat(data.basicSalary),
        licenseNumber:   data.licenseNumber   || null,
        qualifications:  data.qualifications  || null,
        emergencyContact:data.emergencyContact|| null,
        emergencyPhone:  data.emergencyPhone  || null,
        bankName:        data.bankName        || null,
        bankAccount:     data.bankAccount     || null,
      },
      include: { department: true },
    });
  }

  async update(id, data) {
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) throw AppError.notFound('Employee not found');

    const allowed = ['firstName','lastName','phone','email','address','jobTitle','specialization',
      'basicSalary','licenseNumber','qualifications','emergencyContact','emergencyPhone',
      'bankName','bankAccount','departmentId','employmentType'];

    const updateData = {};
    allowed.forEach((f) => { if (data[f] !== undefined) updateData[f] = data[f]; });
    if (data.departmentId) updateData.departmentId = parseInt(data.departmentId);
    if (data.basicSalary)  updateData.basicSalary  = parseFloat(data.basicSalary);

    return prisma.employee.update({ where: { id }, data: updateData, include: { department: true } });
  }

  async toggleStatus(id) {
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) throw AppError.notFound('Employee not found');
    const newStatus = emp.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    return prisma.employee.update({ where: { id }, data: { status: newStatus } });
  }

  async getByDepartment(dept) {
    return prisma.employee.findMany({
      where: { department: { code: dept }, status: 'ACTIVE' },
      select: { ...EMP_SELECT, department: { select: { id:true, name:true } } },
    });
  }

  async getAttendance(id, { skip, limit }) {
    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where: { employeeId: id }, skip, take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({ where: { employeeId: id } }),
    ]);
    return { data, total };
  }

  async getLeaves(id) {
    return prisma.leaveRequest.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: 'desc' },
      include: { leaveType: true },
    });
  }

  async getPayslips(id) {
    return prisma.payroll.findMany({
      where: { employeeId: id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}

module.exports = new EmployeeService();
