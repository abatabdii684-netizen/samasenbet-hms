const bcrypt     = require('bcryptjs');
const { prisma } = require('../config/database');
const AppError   = require('../utils/AppError');
const { generateId } = require('../utils/helpers');

class UserService {
  async getAll({ skip, limit, search, roleId, isActive }) {
    const where = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email:    { contains: search } },
        { employee: { firstName: { contains: search } } },
        { employee: { lastName:  { contains: search } } },
      ];
    }
    if (roleId)   where.roleId   = parseInt(roleId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, username: true, email: true, isActive: true,
          lastLoginAt: true, createdAt: true,
          role: { select: { id: true, name: true, displayName: true } },
          employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        employee: { include: { department: true } },
      },
    });
    if (!user) throw AppError.notFound('User not found');

    const { password, refreshToken, passwordResetToken, ...safe } = user;
    safe.permissions = user.role?.permissions?.map((rp) => rp.permission.name) || [];
    return safe;
  }

  async create(data, createdById) {
    const { username, email, password, roleId, employeeId } = data;

    // Check duplicates
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username }] },
    });
    if (existing) {
      throw AppError.conflict(existing.email === email.toLowerCase()
        ? 'Email already registered' : 'Username already taken');
    }

    const hashedPwd = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);

    const user = await prisma.user.create({
      data: {
        username,
        email:    email.toLowerCase(),
        password: hashedPwd,
        roleId:   parseInt(roleId),
        ...(employeeId ? { employee: { connect: { id: parseInt(employeeId) } } } : {}),
      },
      select: {
        id: true, username: true, email: true, isActive: true, createdAt: true,
        role: { select: { id: true, name: true, displayName: true } },
      },
    });

    return user;
  }

  async update(id, data, updatedById) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound('User not found');

    const updateData = {};
    if (data.username) updateData.username = data.username;
    if (data.email)    updateData.email    = data.email.toLowerCase();
    if (data.roleId)   updateData.roleId   = parseInt(data.roleId);
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
      updateData.passwordChangedAt = new Date();
    }

    const updated = await prisma.user.update({
      where: { id },
      data:  updateData,
      select: {
        id: true, username: true, email: true, isActive: true, updatedAt: true,
        role: { select: { id: true, name: true, displayName: true } },
      },
    });

    return updated;
  }

  async toggleStatus(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound('User not found');

    return prisma.user.update({
      where: { id },
      data:  { isActive: !user.isActive },
      select: { id: true, username: true, email: true, isActive: true },
    });
  }

  async delete(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound('User not found');
    if (user.isSystem) throw AppError.forbidden('Cannot delete a system user');

    await prisma.user.delete({ where: { id } });
  }
}

module.exports = new UserService();
