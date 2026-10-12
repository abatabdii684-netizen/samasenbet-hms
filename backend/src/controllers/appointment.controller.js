const asyncHandler          = require('../middlewares/asyncHandler');
const AppointmentService    = require('../services/appointment.service');
const ApiResponse           = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

class AppointmentController {
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, status, clinicType, doctorId, date } = req.query;
    const { data, total } = await AppointmentService.getAll({
      skip, limit, search, status, clinicType, doctorId, date,
    });
    return ApiResponse.paginated(res, data, page, limit, total);
  });

  getById = asyncHandler(async (req, res) => {
    const appt = await AppointmentService.getById(parseInt(req.params.id));
    return ApiResponse.success(res, appt);
  });

  create = asyncHandler(async (req, res) => {
    const appt = await AppointmentService.create(req.body, req.userId);
    return ApiResponse.created(res, appt, 'Appointment booked successfully');
  });

  update = asyncHandler(async (req, res) => {
    const appt = await AppointmentService.update(parseInt(req.params.id), req.body);
    return ApiResponse.success(res, appt, 'Appointment updated');
  });

  updateStatus = asyncHandler(async (req, res) => {
    const appt = await AppointmentService.updateStatus(parseInt(req.params.id), req.body.status);
    return ApiResponse.success(res, appt, 'Status updated');
  });

  delete = asyncHandler(async (req, res) => {
    await AppointmentService.delete(parseInt(req.params.id));
    return ApiResponse.success(res, null, 'Appointment cancelled');
  });

  getToday = asyncHandler(async (req, res) => {
    const data = await AppointmentService.getToday();
    return ApiResponse.success(res, data);
  });

  getByDoctor = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { data, total } = await AppointmentService.getByDoctor(parseInt(req.params.doctorId), { skip, limit });
    return ApiResponse.paginated(res, data, page, limit, total);
  });
}

module.exports = new AppointmentController();
