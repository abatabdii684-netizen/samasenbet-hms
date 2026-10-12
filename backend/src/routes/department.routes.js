const express    = require('express');
const router     = express.Router();
const { authenticate } = require('../middlewares/auth');
const asyncHandler     = require('../middlewares/asyncHandler');
const { prisma }       = require('../config/database');
const ApiResponse      = require('../utils/apiResponse');

router.use(authenticate);

// GET /departments — list all departments
router.get('/', asyncHandler(async (req, res) => {
  const data = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });
  return ApiResponse.success(res, data);
}));

// GET /departments/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const dept = await prisma.department.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      _count: { select: { employees: true } },
    },
  });
  if (!dept) return ApiResponse.notFound(res, 'Department not found');
  return ApiResponse.success(res, dept);
}));

module.exports = router;
