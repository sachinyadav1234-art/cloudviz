const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

/**
 * Validates the MongoDB connection URI.
 * Checks for missing values, placeholder patterns, and valid URI scheme.
 */
function validateMongoUri(uri) {
  if (!uri || typeof uri !== "string" || !uri.trim()) {
    return {
      isValid: false,
      reason: "MONGODB_URI is missing or empty in backend/.env. Please configure a valid MongoDB connection string."
    };
  }

  const trimmed = uri.trim();
  if (trimmed.includes("<") || trimmed.includes(">") || /<(username|password|cluster-url|[^>]+)>/i.test(trimmed)) {
    return {
      isValid: false,
      reason: "MONGODB_URI contains unreplaced placeholder values (e.g. '<username>', '<password>', '<cluster-url>'). Please replace placeholders with your actual MongoDB Atlas or local MongoDB connection URI in backend/.env."
    };
  }

  if (!trimmed.startsWith("mongodb://") && !trimmed.startsWith("mongodb+srv://")) {
    return {
      isValid: false,
      reason: "MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'."
    };
  }

  return { isValid: true, uri: trimmed };
}

async function connectDatabase() {
  const validation = validateMongoUri(env.mongodbUri);
  if (!validation.isValid) {
    const errorMsg = `[MongoDB Configuration Error] ${validation.reason}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(validation.uri);
    logger.info("MongoDB connected successfully");

    mongoose.connection.on("error", (err) => logger.error(`MongoDB error: ${err.message}`));
    mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));

    return mongoose.connection;
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    throw err;
  }
}

module.exports = { connectDatabase, validateMongoUri };

