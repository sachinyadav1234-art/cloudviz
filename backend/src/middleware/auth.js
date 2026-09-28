const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { failure } = require("../utils/response");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return failure(res, "UNAUTHORIZED", "Authentication token is required", 401);
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return failure(res, "UNAUTHORIZED", "Invalid or expired token", 401);
  }
}

module.exports = { authenticate };
