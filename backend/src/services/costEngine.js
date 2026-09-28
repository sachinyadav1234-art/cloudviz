const CostRecord = require("../models/CostRecord");
const CloudAccount = require("../models/CloudAccount");
const { getAdapter } = require("../providers");

async function refreshDemoCost(userId) {
  const account = await CloudAccount.findOne({ userId, provider: "DEMO" });
  if (!account) return [];

  const adapter = getAdapter("DEMO");
  const costData = await adapter.getCostData();

  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date();

  const records = [];
  for (const c of costData) {
    // Upsert on (userId, provider, periodStart) so repeated refreshes within the same
    // billing period UPDATE the current month's figure instead of accumulating duplicate
    // records that would otherwise be summed together and inflate the total.
    const record = await CostRecord.findOneAndUpdate(
      { userId, provider: c.provider, periodStart },
      {
        $set: {
          cloudAccountId: account._id,
          periodEnd,
          amount: c.amount,
          currency: c.currency,
          costType: "TOTAL",
          source: c.source,
          isEstimated: c.isEstimated
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    records.push(record);
  }
  return records;
}

async function getCostSummary(userId) {
  // Only the CURRENT period's record per provider counts toward the total -
  // historical periods are kept in the collection for trend charts but must not
  // be summed together into "total cost", or the number would only ever grow.
  const latestByProvider = await CostRecord.aggregate([
    { $match: { userId: new (require("mongoose").Types.ObjectId)(userId) } },
    { $sort: { periodStart: -1 } },
    { $group: {
        _id: "$provider",
        amount: { $first: "$amount" },
        currency: { $first: "$currency" },
        isEstimated: { $first: "$isEstimated" },
        periodStart: { $first: "$periodStart" }
    } }
  ]);

  const byProvider = {};
  for (const r of latestByProvider) {
    byProvider[r._id] = { amount: r.amount, currency: r.currency, isEstimated: r.isEstimated };
  }
  const total = Object.values(byProvider).reduce((sum, v) => sum + v.amount, 0);

  const recentRecords = await CostRecord.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
  return { total, byProvider, recentRecords };
}

module.exports = { refreshDemoCost, getCostSummary };
