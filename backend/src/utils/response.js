function success(res, data, message = "Request successful", status = 200) {
  return res.status(status).json({ success: true, data, message });
}
function failure(res, code, message, status = 400) {
  return res.status(status).json({ success: false, error: { code, message } });
}
module.exports = { success, failure };
