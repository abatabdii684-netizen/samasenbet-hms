const { prisma } = require('../config/database');
const AppError   = require('../utils/AppError');

class RoleService {
  async getAll() {
    return prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true } },
        permissions: { include: { permission: true } },
      },
    });
  }

  async getById(id) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw AppError.notFound('Role not found');
    return role;
  }

  async create(data) {
    const exists = await prisma.role.findUnique({ where: { name: data.name } });
    if (exists) throw AppError.conflict('Role name already exists');
    return prisma.role.create({ data: { name: data.name, displayName: data.displayName, description: data.description } });
  }

  async update(id, data) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw AppError.notFound('Role not found');
    if (role.isSystem && data.name) throw AppError.forbidden('Cannot rename system roles');
    return prisma.role.update({ where: { id }, data: { displayName: data.displayName, description: data.description } });
  }

  async delete(id) {
    const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if (!role) throw AppError.notFound('Role not found');
    if (role.isSystem) throw AppError.forbidden('Cannot delete system roles');
    if (role._count.users > 0) throw AppError.conflict('Cannot delete role — users are assigned to it');
    await prisma.role.delete({ where: { id } });
  }

  async getAllPermissions() {
    return prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  }

  async assignPermissions(roleId, permissionIds) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw AppError.notFound('Role not found');

    // Delete existing, re-create
    await prisma.rolePermission.deleteMany({ where: { roleId } });

    if (permissionIds && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((pid) => ({ roleId, permissionId: parseInt(pid) })),
        skipDuplicates: true,
      });
    }

    return this.getById(roleId);
  }
}

module.exports = new RoleService();
