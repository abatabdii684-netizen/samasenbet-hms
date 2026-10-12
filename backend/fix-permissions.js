/**
 * Fix permissions + create admin employee profile
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ROLE_EXTRA_PERMS = {
  CEO:               ['opd:view','opd:create','opd:diagnose','opd:prescribe','lab:view','lab:create','lab:enter_results','lab:approve','lab:manage_catalog','pharmacy:view','pharmacy:dispense','pharmacy:manage_drugs','pharmacy:manage_stock'],
  ADMIN_FINANCE:     ['opd:view','opd:create','opd:diagnose','opd:prescribe','lab:view','lab:create','lab:approve'],
  MEDICAL_DIRECTOR:  ['opd:view','opd:create','opd:diagnose','opd:prescribe','lab:view','lab:create','lab:approve'],
  MEDICAL_SUPERVISOR:['opd:view','opd:create','opd:diagnose','opd:prescribe','lab:view','lab:create','lab:approve'],
  PHARMACY_HEAD:     ['opd:view','lab:view'],
  LAB_HEAD:          ['opd:view','lab:approve'],
  LAB_TECHNICIAN:    ['dashboard:view','patients:view','lab:view','lab:enter_results','lab:approve'],
  CASHIER:           ['opd:view'],
  MATRON:            ['opd:view'],
  NURSE:             ['opd:view','triage:view','triage:create','triage:update'],
  WARD_HEAD:         ['opd:view'],
  DOCTOR:            ['opd:view','opd:create','opd:diagnose','opd:prescribe','lab:view','lab:create','pharmacy:view','employees:view','triage:view','admissions:view','admissions:create','or:view','or:schedule','delivery:view','delivery:create'],
  OPD_HEAD:          ['opd:view','opd:create','opd:diagnose','opd:prescribe','triage:view','appointments:view','reports:view','pharmacy:view','employees:view','lab:view','lab:create'],
  RECEPTION_HEAD:    ['opd:view','opd:create','employees:view','patients:view','patients:create','patients:update','appointments:view','appointments:create','appointments:update','billing:view','billing:create','reports:view'],
};

async function main() {
  console.log('🔧 Fixing permissions...\n');

  // 1. Fix permissions
  for (const [roleName, perms] of Object.entries(ROLE_EXTRA_PERMS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) { console.log(`  ⚠️  Role not found: ${roleName}`); continue; }

    for (const permName of perms) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (!perm) { console.log(`  ⚠️  Permission not found: ${permName}`); continue; }

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
      console.log(`  ✓ ${roleName} → ${permName}`);
    }
  }

  // 2. Create employee profiles for admin users who don't have one
  console.log('\n🔧 Creating employee profiles for admin users...\n');

  const adminUsers = await prisma.user.findMany({
    where: {
      role: { name: { in: ['CEO','ADMIN_FINANCE','MEDICAL_DIRECTOR','MEDICAL_SUPERVISOR'] } },
      employee: null,
    },
    include: { role: true },
  });

  // Find admin department
  let adminDept = await prisma.department.findFirst({ where: { code: 'ADM' } });
  if (!adminDept) adminDept = await prisma.department.findFirst();

  for (const user of adminUsers) {
    const empNo = `EMP-${String(user.id).padStart(4,'0')}`;
    const existing = await prisma.employee.findFirst({ where: { employeeNo: empNo } });
    if (existing) {
      // Link employee to user if not linked
      if (!existing.userId) {
        await prisma.employee.update({ where: { id: existing.id }, data: { userId: user.id } });
        console.log(`  ✓ Linked existing employee to ${user.email}`);
      } else {
        console.log(`  ℹ️  Employee already exists for ${user.email}`);
      }
      continue;
    }

    await prisma.employee.create({
      data: {
        employeeNo:     empNo,
        userId:         user.id,
        firstName:      user.username.split('.')[0] || user.username,
        lastName:       user.username.split('.')[1] || 'Admin',
        gender:         'MALE',
        dateOfBirth:    new Date('1985-01-01'),
        phone:          '+251911000000',
        jobTitle:       user.role.displayName,
        departmentId:   adminDept?.id,
        employmentType: 'FULL_TIME',
        startDate:      new Date('2020-01-01'),
        status:         'ACTIVE',
      },
    });
    console.log(`  ✓ Created employee profile for ${user.email}`);
  }

  console.log('\n✅ All fixes applied successfully!');
  console.log('→ Restart the backend and log out/in to apply changes.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
