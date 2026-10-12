const asyncHandler     = require('../middlewares/asyncHandler');
const PatientService   = require('../services/patient.service');
const ApiResponse      = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

class PatientController {
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, gender, isActive } = req.query;
    const { data, total } = await PatientService.getAll({ skip, limit, search, gender, isActive });
    return ApiResponse.paginated(res, data, page, limit, total);
  });

  getById = asyncHandler(async (req, res) => {
    const patient = await PatientService.getById(parseInt(req.params.id));
    return ApiResponse.success(res, patient);
  });

  create = asyncHandler(async (req, res) => {
    const patient = await PatientService.create(req.body, req.userId);
    return ApiResponse.created(res, patient, 'Patient registered successfully');
  });

  update = asyncHandler(async (req, res) => {
    const patient = await PatientService.update(parseInt(req.params.id), req.body);
    return ApiResponse.success(res, patient, 'Patient updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await PatientService.delete(parseInt(req.params.id));
    return ApiResponse.success(res, null, 'Patient deleted successfully');
  });

  getHistory = asyncHandler(async (req, res) => {
    const history = await PatientService.getHistory(parseInt(req.params.id));
    return ApiResponse.success(res, history);
  });

  getVisits = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { data, total } = await PatientService.getVisits(parseInt(req.params.id), { skip, limit });
    return ApiResponse.paginated(res, data, page, limit, total);
  });

  getPrescriptions = asyncHandler(async (req, res) => {
    const rxs = await PatientService.getPrescriptions(parseInt(req.params.id));
    return ApiResponse.success(res, rxs);
  });

  getLabResults = asyncHandler(async (req, res) => {
    const results = await PatientService.getLabResults(parseInt(req.params.id));
    return ApiResponse.success(res, results);
  });

  getBilling = asyncHandler(async (req, res) => {
    const bills = await PatientService.getBilling(parseInt(req.params.id));
    return ApiResponse.success(res, bills);
  });
}

module.exports = new PatientController();
