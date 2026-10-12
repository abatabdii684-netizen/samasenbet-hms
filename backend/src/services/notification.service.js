/**
 * Notification Service
 * Creates in-app notifications for users when key events occur.
 */

const { prisma } = require('../config/database');

/**
 * Create a notification for a specific user.
 * Silent — never throws, so it never blocks the parent operation.
 */
async function notify(userId, { title, message, type = 'INFO', module = null, link = null }) {
  if (!userId) return;
  try {
    await prisma.notification.create({
      data: { userId: parseInt(userId), title, message, type, module, link },
    });
  } catch (err) {
    console.error('Failed to create notification (non-fatal):', err.message);
  }
}

/**
 * Notify all users who have a specific role.
 */
async function notifyRole(roleName, payload) {
  try {
    const users = await prisma.user.findMany({
      where: { role: { name: roleName }, isActive: true },
      select: { id: true },
    });
    await Promise.all(users.map(u => notify(u.id, payload)));
  } catch (err) {
    console.error('Failed to notify role (non-fatal):', err.message);
  }
}

/**
 * Notify all users who have any of the given roles.
 */
async function notifyRoles(roleNames, payload) {
  try {
    const users = await prisma.user.findMany({
      where: { role: { name: { in: roleNames } }, isActive: true },
      select: { id: true },
    });
    await Promise.all(users.map(u => notify(u.id, payload)));
  } catch (err) {
    console.error('Failed to notify roles (non-fatal):', err.message);
  }
}

module.exports = { notify, notifyRole, notifyRoles };
