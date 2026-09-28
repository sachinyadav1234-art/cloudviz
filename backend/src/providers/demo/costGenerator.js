function generateDemoCost(provider, resourceCount) {
  const perResourceAvg = provider === "AWS" ? 820 : 700; // INR per resource per month (illustrative demo figure)
  const amount = Math.round(perResourceAvg * resourceCount * (0.85 + Math.random() * 0.3));
  return {
    provider,
    amount,
    currency: "INR",
    isEstimated: true,
    source: "DEMO_DATA"
  };
}

module.exports = { generateDemoCost };
