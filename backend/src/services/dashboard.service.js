const { prisma } = require('../config/database');

class DashboardService {
  async getOverview() {
    const today = new Date();
    const todayStart = new Date(today.setHours(0,0,0,0));
    const todayEnd   = new Date(today.setHours(23,59,59,999));
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalPatients,
      todayVisits,
      activeAdmissions,
      availableBeds,
      totalBeds,
      pendingLabOrders,
      pendingPrescriptions,
      todayRevenue,
      monthRevenue,
      todayAppointments,
      lowStockCount,
    ] = await Promise.all([
      prisma.patient.count({ where: { isActive: true } }),
      prisma.visit.count({ where: { visitDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.admission.count({ where: { status: 'ACTIVE' } }),
      prisma.bed.count({ where: { status: 'AVAILABLE' } }),
      prisma.bed.count(),
      prisma.labOrder.count({ where: { status: { in: ['PENDING','IN_PROGRESS','SAMPLE_COLLECTED'] } } }),
      prisma.prescription.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: monthStart }, status: 'COMPLETED' },
      }),
      prisma.appointment.count({
        where: { scheduledAt: { gte: todayStart, lte: todayEnd }, status: { notIn: ['CANCELLED'] } },
      }),
      // Low stock drugs
      prisma.$queryRaw`
        SELECT COUNT(*) as cnt FROM (
          SELECT d.id, d.reorder_level, COALESCE(SUM(ds.quantity),0) as total
          FROM drugs d
          LEFT JOIN drug_stocks ds ON ds.drug_id = d.id
          WHERE d.is_active = 1
          GROUP BY d.id, d.reorder_level
          HAVING total <= d.reorder_level
        ) t
      `.catch(() => [{ cnt: 0 }]),
    ]);

    return {
      totalPatients,
      todayVisits,
      activeAdmissions,
      bedOccupancy: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
      availableBeds,
      totalBeds,
      pendingLabOrders,
      pendingPrescriptions,
      todayRevenue:  Number(todayRevenue._sum.amount  || 0),
      monthRevenue:  Number(monthRevenue._sum.amount  || 0),
      todayAppointments,
      lowStockCount: Number(lowStockCount[0]?.cnt || 0),
    };
  }

  async getPatientChart() {
    // Last 12 months visit counts
    const results = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = await prisma.visit.count({ where: { visitDate: { gte: start, lte: end } } });
      results.push({
        month: start.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        count,
      });
    }
    return results;
  }

  async getRevenueChart() {
    const results = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const agg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: start, lte: end }, status: 'COMPLETED' },
      });
      results.push({
        month:   start.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        revenue: Number(agg._sum.amount || 0),
      });
    }
    return results;
  }

  async getAlerts() {
    const alerts = [];

    // Low stock
    const drugs = await prisma.drug.findMany({
      where: { isActive: true },
      include: { stocks: { select: { quantity: true } } },
    });
    const lowStock = drugs.filter((d) => d.stocks.reduce((s, st) => s + st.quantity, 0) <= d.reorderLevel);
    if (lowStock.length > 0) {
      alerts.push({ type: 'WARNING', message: `${lowStock.length} drug(s) below reorder level`, module: 'pharmacy' });
    }

    // Pending lab results
    const pendingLab = await prisma.labOrder.count({ where: { status: 'COMPLETED' } });
    if (pendingLab > 0) {
      alerts.push({ type: 'INFO', message: `${pendingLab} lab result(s) awaiting doctor review`, module: 'laboratory' });
    }

    // Pending leave approvals
    const pendingLeave = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    if (pendingLeave > 0) {
      alerts.push({ type: 'INFO', message: `${pendingLeave} leave request(s) pending approval`, module: 'hr' });
    }

    return alerts;
  }

  async getRecentActivity() {
    const [recentVisits, recentAdmissions, recentPayments] = await Promise.all([
      prisma.visit.findMany({
        take: 5, orderBy: { visitDate: 'desc' },
        include: { patient: { select: { firstName:true, lastName:true, patientId:true } } },
      }),
      prisma.admission.findMany({
        take: 5, orderBy: { admissionDate: 'desc' },
        include: { patient: { select: { firstName:true, lastName:true, patientId:true } } },
      }),
      prisma.payment.findMany({
        take: 5, orderBy: { paidAt: 'desc' },
        include: { bill: { include: { patient: { select: { firstName:true, lastName:true } } } } },
      }),
    ]);
    return { recentVisits, recentAdmissions, recentPayments };
  }
}

module.exports = new DashboardService();
