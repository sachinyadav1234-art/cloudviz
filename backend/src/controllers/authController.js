const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");
const { success, failure } = require("../utils/response");
const { recordAudit } = require("../services/auditService");

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return failure(res, "VALIDATION_ERROR", "name, email and password are required");
    if (password.length < 8) return failure(res, "VALIDATION_ERROR", "Password must be at least 8 characters");

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return failure(res, "EMAIL_IN_USE", "An account with this email already exists", 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

    const token = signToken(user);
    await recordAudit({ userId: user._id, action: "REGISTER", entityType: "User", entityId: user._id, req });
    return success(res, { token, user: { id: user._id, name: user.name, email: user.email } }, "Account created", 201);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return failure(res, "VALIDATION_ERROR", "email and password are required");

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return failure(res, "INVALID_CREDENTIALS", "Invalid email or password", 401);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return failure(res, "INVALID_CREDENTIALS", "Invalid email or password", 401);

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    await recordAudit({ userId: user._id, action: "LOGIN", entityType: "User", entityId: user._id, req });
    return success(res, { token, user: { id: user._id, name: user.name, email: user.email } }, "Login successful");
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return failure(res, "NOT_FOUND", "User not found", 404);
    return success(res, { user });
  } catch (err) { next(err); }
}

module.exports = { register, login, me };
