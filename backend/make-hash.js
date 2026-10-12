// Diagnostic: check user permissions in DB
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@yfmhospital.com' },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } }
        }
      }
    }
  });

  if (!user) { console.log('USER NOT FOUND'); return; }

  console.log('User ID:', user.id);
  console.log('Role:', user.role?.name);
  console.log('Is Active:', user.isActive);
  console.log('Permission count:', user.role?.permissions?.length ?? 0);

  const perms = user.role?.permissions?.map(rp => rp.permission.name) ?? [];
  console.log('Has dashboard:view:', perms.includes('dashboard:view'));
  console.log('All permissions:', perms.slice(0, 10), '...');
}

main().catch(console.error).finally(() => prisma.$disconnect());
