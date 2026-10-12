const { prisma }     = require('../config/database');
const AppError       = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

class PayrollService {
  async getAll({ skip, limit, month, year, status, employeeId }) {
    const where = {};
    if (month)      where.month      = parseInt(month);
    if (year)       where.year       = parseInt(year);
    if (status)     where.status     = status;
    if (employeeId) where.employeeId = parseInt(employeeId);

    const [data, total] = await Promise.all([
      prisma.payroll.findMany({
        where, skip, take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          employee: {
            select: { id:true, employeeNo:true, firstName:true, lastName:true,
                      jobTitle:true, bankName:true, bankAccount:true,
                      department: { select: { name:true } } },
          },
        },
      }),
      prisma.payroll.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id) {
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: { employee: { include: { department: true } } },
    });
    if (!payroll) throw AppError.notFound('Payroll record not found');
    return payroll;
  }

  /**
   * Generate payroll for a given month/year for all active employees
   * or a single employee
   */
  async generate(month, year, employeeId = null) {
    const where = { status: 'ACTIVE' };
    if (employeeId) where.id = parseInt(employeeId);

    const employees = await prisma.employee.findMany({
      where,
      include: {
        attendances: {
          where: {
            date: {
              gte: new Date(year, month - 1, 1),
              lte: new Date(year, month,     0, 23, 59, 59),
            },
          },
        },
      },
    });

    const generated = [];

    for (const emp of employees) {
      // Skip if already generated
      const existing = await prisma.payroll.findUnique({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
      });
      if (existing) continue;

      const basicSalary = parseFloat(emp.basicSalary);

      // Ethiopian tax brackets (simplified)
      const incomeTax = this._calcIncomeTax(basicSalary);
      const pensionEmployee = basicSalary * 0.07;  // 7%
      const pensionEmployer = basicSalary * 0.11;  // 11%

      // Overtime calculation
      const overtimeHours = emp.attendances.reduce((s, a) => s + (parseFloat(a.overtime) || 0), 0);
      const hourlyRate    = basicSalary / (22 * 8);
      const overtime      = parseFloat((overtimeHours * hourlyRate * 1.25).toFixed(2));

      // Allowances (can be expanded)
      const allowances    = 0;

      const grossSalary   = basicSalary + allowances + overtime;
      const totalDeductions = incomeTax + pensionEmployee;
      const netSalary     = grossSalary - totalDeductions;

      const payroll = await prisma.payroll.create({
        data: {
          payrollNo:       generateId('PAY'),
          employeeId:      emp.id,
          month,
          year,
          basicSalary,
          allowances,
          overtime,
          grossSalary,
          incomeTax,
          pensionEmployee,
          pensionEmployer,
          totalDeductions,
          netSalary,
        },
      });
      generated.push(payroll);
    }

    return generated;
  }

  async approve(id, approvedById) {
    const payroll = await prisma.payroll.findUnique({ where: { id } });
    if (!payroll) throw AppError.notFound('Payroll not found');
    if (payroll.status !== 'DRAFT') throw AppError.badRequest('Only draft payrolls can be approved');
    return prisma.payroll.update({
      where: { id },
      data:  { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });
  }

  async markPaid(id, paymentRef) {
    const payroll = await prisma.payroll.findUnique({ where: { id } });
    if (!payroll) throw AppError.notFound('Payroll not found');
    if (payroll.status !== 'APPROVED') throw AppError.badRequest('Only approved payrolls can be marked as paid');
    return prisma.payroll.update({
      where: { id },
      data:  { status: 'PAID', paidAt: new Date(), paymentRef: paymentRef || null },
    });
  }

  // Ethiopian progressive tax (simplified)
  _calcIncomeTax(grossSalary) {
    if (grossSalary <= 600)   return 0;
    if (grossSalary <= 1650)  return (grossSalary - 600)  * 0.10;
    if (grossSalary <= 3200)  return 105  + (grossSalary - 1650) * 0.15;
    if (grossSalary <= 5250)  return 337.5 + (grossSalary - 3200) * 0.20;
    if (grossSalary <= 7800)  return 747.5 + (grossSalary - 5250) * 0.25;
    if (grossSalary <= 10900) return 1385  + (grossSalary - 7800) * 0.30;
    return 2315 + (grossSalary - 10900) * 0.35;
  }
}

module.exports = new PayrollService();
