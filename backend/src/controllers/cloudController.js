const CloudAccount = require("../models/CloudAccount");
const Resource = require("../models/Resource");
const { getAdapter } = require("../providers");
const { syncCloudAccount } = require("../services/syncService");
const { success, failure } = require("../utils/response");
const { recordAudit } = require("../services/auditService");

async function listAccounts(req, res, next) {
  try {
    const accounts = await CloudAccount.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return success(res, { accounts });
  } catch (err) { next(err); }
}

async function connectAccount(req, res, next) {
  try {
    const { provider, accountName, region } = req.body;
    if (!provider || !["AWS", "OCI", "DEMO"].includes(provider)) {
      return failure(res, "VALIDATION_ERROR", "provider must be one of AWS, OCI, DEMO");
    }

    // Guard against duplicate accounts for the same provider - without this, a double-click
    // or a retried request would create a second account and duplicate every discovered
    // resource under a different cloudAccountId (the resource uniqueness constraint is
    // scoped per-account, not per-provider).
    const existing = await CloudAccount.findOne({ userId: req.user.id, provider, status: { $ne: "DISABLED" } });
    if (existing) {
      const adapter = getAdapter(provider);
      const test = await adapter.testConnection();
      existing.status = test.success ? "CONNECTED" : "ERROR";
      existing.lastSyncStatus = test.success ? existing.lastSyncStatus : "FAILED";
      existing.lastSyncError = test.success ? undefined : test.message;
      await existing.save();
      if (test.success) syncCloudAccount(existing).catch(() => {});
      return success(res, { account: existing, connectionTest: test }, `${provider} was already connected — refreshed instead`, 200);
    }

    const adapter = getAdapter(provider);
    const test = await adapter.testConnection();

    let account;
    try {
      account = await CloudAccount.create({
        userId: req.user.id,
        provider,
        accountName: accountName || `${provider} Account`,
        region,
        status: test.success ? "CONNECTED" : "ERROR",
        lastSyncStatus: test.success ? undefined : "FAILED",
        lastSyncError: test.success ? undefined : test.message
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        // Two concurrent connect requests raced past the findOne check above -
        // the unique index caught it. Treat this the same as "already connected".
        account = await CloudAccount.findOne({ userId: req.user.id, provider });
        return success(res, { account, connectionTest: test }, `${provider} was already connected`, 200);
      }
      throw createErr;
    }

    if (test.success) {
      // Kick off an initial sync so the dashboard has data immediately.
      syncCloudAccount(account).catch(() => {});
    }

    await recordAudit({ userId: req.user.id, action: "CONNECT_CLOUD", entityType: "CloudAccount", entityId: account._id, metadata: { provider }, req });

    return success(res, { account, connectionTest: test }, test.success ? "Cloud account connected" : "Account created, but connection test failed", 201);
  } catch (err) { next(err); }
}

async function testAccount(req, res, next) {
  try {
    const account = await CloudAccount.findOne({ _id: req.params.id, userId: req.user.id });
    if (!account) return failure(res, "NOT_FOUND", "Cloud account not found", 404);

    const adapter = getAdapter(account.provider);
    const test = await adapter.testConnection();
    return success(res, { connectionTest: test });
  } catch (err) { next(err); }
}

async function syncAccount(req, res, next) {
  try {
    const account = await CloudAccount.findOne({ _id: req.params.id, userId: req.user.id });
    if (!account) return failure(res, "NOT_FOUND", "Cloud account not found", 404);

    const job = await syncCloudAccount(account);
    await recordAudit({ userId: req.user.id, action: "SYNC_RESOURCES", entityType: "CloudAccount", entityId: account._id, req });
    return success(res, { job }, "Synchronization complete");
  } catch (err) { next(err); }
}

async function deleteAccount(req, res, next) {
  try {
    const account = await CloudAccount.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!account) return failure(res, "NOT_FOUND", "Cloud account not found", 404);

    // Mark resources inactive rather than deleting them outright - this preserves
    // historical metrics/health/alert data for retention and research purposes
    // (see BACKEND_SCHEMA.md Section 57) while removing them from active dashboard views.
    await Resource.updateMany({ cloudAccountId: account._id }, { $set: { isActive: false } });

    await recordAudit({ userId: req.user.id, action: "DISCONNECT_CLOUD", entityType: "CloudAccount", entityId: account._id, metadata: { provider: account.provider }, req });
    return success(res, {}, "Cloud account disconnected");
  } catch (err) { next(err); }
}

module.exports = { listAccounts, connectAccount, testAccount, syncAccount, deleteAccount };
