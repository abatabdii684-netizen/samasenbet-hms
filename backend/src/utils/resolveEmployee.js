/**
 * Resolves the Employee ID for the currently logged-in user.
 * Returns null if the user has no linked employee profile.
 * This prevents passing a User.id as an Employee FK (different tables).
 */
const { prisma } = require('../config/database');

const resolveEmployeeId = async (userId) => {
  if (!userId) return null;
  const employee = await prisma.employee.findFirst({
    where: { userId },
    select: { id: true },
  });
  return employee?.id ?? null;
};

module.exports = resolveEmployeeId;
