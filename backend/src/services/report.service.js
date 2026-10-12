const { prisma }  = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS     = require('exceljs');
const path        = require('path');
const fs          = require('fs');

const REPORT_DIR = process.env.REPORT_DIR || 'reports';
['pdf','excel'].forEach((d) => {
  if (!fs.existsSync(`${REPORT_DIR}/${d}`)) fs.mkdirSync(`${REPORT_DIR}/${d}`, { recursive: true });
});

class ReportService {
  async getDaily(date) {
    const d = date ? new Date(date) : new Date();
    const start = new Date(d.setHours(0,0,0,0));
    const end   = new Date(d.setHours(23,59,59,999));

    const [visits, admissions, discharges, revenue, labOrders, prescriptions] = await Promise.all([
      prisma.visit.count({ where: { visitDate: { gte: start, lte: end } } }),
      prisma.admission.count({ where: { admissionDate: { gte: start, lte: end } } }),
      prisma.admission.count({ where: { actualDischarge: { gte: start, lte: end } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: start, lte: end }, status: 'COMPLETED' } }),
      prisma.labOrder.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.prescription.count({ where: { createdAt: { gte: start, lte: end } } }),
    ]);

    return { date: start, visits, admissions, discharges, revenue: Number(revenue._sum.amount || 0), labOrders, prescriptions };
  }

  async getMonthly(month, year) {
    const m = parseInt(month || new Date().getMonth() + 1);
    const y = parseInt(year  || new Date().getFullYear());
    const start = new Date(y, m - 1, 1);
    const end   = new Date(y, m,     0, 23, 59, 59);

    const [totalVisits, totalAdmissions, totalRevenue, topDiagnoses] = await Promise.all([
      prisma.visit.count({ where: { visitDate: { gte: start, lte: end } } }),
      prisma.admission.count({ where: { admissionDate: { gte: start, lte: end } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: start, lte: end }, status: 'COMPLETED' } }),
      prisma.visit.groupBy({
        by: ['diagnosis'],
        _count: { diagnosis: true },
        where: { visitDate: { gte: start, lte: end }, diagnosis: { not: null } },
        orderBy: { _count: { diagnosis: 'desc' } },
        take: 10,
      }),
    ]);

    return { month: m, year: y, totalVisits, totalAdmissions, totalRevenue: Number(totalRevenue._sum.amount || 0), topDiagnoses };
  }

  async getRevenue(startDate, endDate) {
    const start = new Date(startDate || new Date().setDate(1));
    const end   = new Date(endDate   || new Date());

    const [byMethod, daily, total] = await Promise.all([
      prisma.payment.groupBy({
        by: ['method'],
        _sum: { amount: true },
        where: { paidAt: { gte: start, lte: end }, status: 'COMPLETED' },
      }),
      prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end }, status: 'COMPLETED' },
        orderBy: { paidAt: 'asc' },
        include: { bill: { include: { patient: { select: { firstName:true, lastName:true, patientId:true } } } } },
      }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: start, lte: end }, status: 'COMPLETED' } }),
    ]);

    return {
      startDate: start, endDate: end,
      total: Number(total._sum.amount || 0),
      byMethod: byMethod.map((m) => ({ method: m.method, amount: Number(m._sum.amount || 0) })),
      transactions: daily,
    };
  }

  async getPatients(startDate, endDate) {
    const start = new Date(startDate || new Date().setDate(1));
    const end   = new Date(endDate   || new Date());

    const [newPatients, byGender, byAgeGroup] = await Promise.all([
      prisma.patient.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'desc' },
        select: { id:true, patientId:true, firstName:true, lastName:true, gender:true, dateOfBirth:true, phone:true, createdAt:true },
      }),
      prisma.patient.groupBy({ by: ['gender'], _count: { gender: true }, where: { createdAt: { gte: start, lte: end } } }),
      // Age groups — simplified
      prisma.patient.findMany({ where: { isActive: true }, select: { dateOfBirth: true } }),
    ]);

    const ageGroups = { '0-12': 0, '13-18': 0, '19-35': 0, '36-60': 0, '60+': 0 };
    const now = new Date();
    byAgeGroup.forEach((p) => {
      const age = Math.floor((now - new Date(p.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      if      (age <= 12)  ageGroups['0-12']++;
      else if (age <= 18)  ageGroups['13-18']++;
      else if (age <= 35)  ageGroups['19-35']++;
      else if (age <= 60)  ageGroups['36-60']++;
      else                 ageGroups['60+']++;
    });

    return { startDate: start, endDate: end, newPatients, byGender, ageGroups };
  }

  async getLaboratory(startDate, endDate) {
    const start = new Date(startDate || new Date().setDate(1));
    const end   = new Date(endDate   || new Date());

    const [orders, byStatus, byTest] = await Promise.all([
      prisma.labOrder.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { patient: { select: { firstName:true, lastName:true, patientId:true } }, items: { include: { test: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.labOrder.groupBy({ by: ['status'], _count: { status: true }, where: { createdAt: { gte: start, lte: end } } }),
      prisma.labOrderItem.groupBy({
        by: ['testId'], _count: { testId: true },
        where: { order: { createdAt: { gte: start, lte: end } } },
        orderBy: { _count: { testId: 'desc' } }, take: 10,
      }),
    ]);

    return { startDate: start, endDate: end, totalOrders: orders.length, byStatus, orders: orders.slice(0, 100) };
  }

  // ─── PDF Export ───────────────────────────────────────────────
  async exportPDF(type, params) {
    const data = await this._getData(type, params);
    const filename = `${type}-${Date.now()}.pdf`;
    const filepath = path.join(REPORT_DIR, 'pdf', filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('YOHANNES FANTAYE METASEBIYA GENERAL HOSPITAL PLC', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text(`${type.toUpperCase()} REPORT`, { align: 'center' });
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Content
      doc.fontSize(10).font('Helvetica').text(JSON.stringify(data, null, 2));

      doc.end();
      stream.on('finish', () => resolve({ filename, filepath }));
      stream.on('error', reject);
    });
  }

  // ─── Excel Export ─────────────────────────────────────────────
  async exportExcel(type, params) {
    const data = await this._getData(type, params);
    const filename = `${type}-${Date.now()}.xlsx`;
    const filepath = path.join(REPORT_DIR, 'excel', filename);

    const workbook = new ExcelJS.Workbook();
    workbook.creator  = 'YFM General Hospital PLC';
    workbook.created  = new Date();

    const sheet = workbook.addWorksheet(type.toUpperCase());

    // Style header row
    sheet.getRow(1).font      = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height    = 25;

    // Add data dynamically
    if (Array.isArray(data)) {
      if (data.length > 0) {
        sheet.columns = Object.keys(data[0]).map((k) => ({ header: k, key: k, width: 20 }));
        data.forEach((row) => sheet.addRow(row));
      }
    } else {
      sheet.columns = [{ header: 'Key', key: 'key', width: 30 }, { header: 'Value', key: 'value', width: 40 }];
      Object.entries(data).forEach(([k, v]) => sheet.addRow({ key: k, value: JSON.stringify(v) }));
    }

    await workbook.xlsx.writeFile(filepath);
    return { filename, filepath };
  }

  async _getData(type, params) {
    switch (type) {
      case 'daily':      return this.getDaily(params.date);
      case 'monthly':    return this.getMonthly(params.month, params.year);
      case 'revenue':    return this.getRevenue(params.startDate, params.endDate);
      case 'patients':   return this.getPatients(params.startDate, params.endDate);
      case 'laboratory': return this.getLaboratory(params.startDate, params.endDate);
      default:           return this.getDaily();
    }
  }
}

module.exports = new ReportService();
