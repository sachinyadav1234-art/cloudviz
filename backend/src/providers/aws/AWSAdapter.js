const env = require("../../config/env");
const logger = require("../../utils/logger");

/**
 * AWSAdapter - Live AWS integration.
 *
 * Activates automatically once AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are set in .env.
 * Uses AWS SDK v3 client packages (added to package.json):
 *   @aws-sdk/client-sts, @aws-sdk/client-ec2, @aws-sdk/client-cloudwatch, @aws-sdk/client-cost-explorer
 *
 * Requires only READ-ONLY IAM permissions:
 *   AmazonEC2ReadOnlyAccess, CloudWatchReadOnlyAccess
 * (Cost Explorer calls only fire if AWS_ENABLE_COST_EXPLORER=true, because each
 *  Cost Explorer API request currently costs AWS customers money — see TRD Section 17.)
 *
 * This class implements the same adapter contract as DemoAdapter/OCIAdapter, so it
 * plugs directly into the existing sync pipeline (syncService.js) with no other changes.
 */
class AWSAdapter {
  constructor() {
    this.configured = Boolean(env.aws.accessKeyId && env.aws.secretAccessKey);
    this._credentials = this.configured
      ? { accessKeyId: env.aws.accessKeyId, secretAccessKey: env.aws.secretAccessKey }
      : null;
    this._region = env.aws.region;
  }

  _requireSdk(pkg) {
    try {
      return require(pkg);
    } catch (err) {
      throw new Error(
        `${pkg} is not installed. Run "npm install ${pkg}" in backend/ to activate live AWS monitoring.`
      );
    }
  }

  async testConnection() {
    if (!this.configured) {
      return { success: false, message: "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in backend/.env." };
    }
    try {
      const { STSClient, GetCallerIdentityCommand } = this._requireSdk("@aws-sdk/client-sts");
      const client = new STSClient({ region: this._region, credentials: this._credentials });
      const identity = await client.send(new GetCallerIdentityCommand({}));
      return { success: true, message: `Connected as ${identity.Arn}` };
    } catch (err) {
      logger.error(`AWS testConnection failed: ${err.message}`);
      return { success: false, message: `AWS connection failed: ${err.message}` };
    }
  }

  async getRegions() {
    if (!this.configured) return [this._region];
    try {
      const { EC2Client, DescribeRegionsCommand } = this._requireSdk("@aws-sdk/client-ec2");
      const client = new EC2Client({ region: this._region, credentials: this._credentials });
      const result = await client.send(new DescribeRegionsCommand({}));
      return (result.Regions || []).map(r => r.RegionName);
    } catch (err) {
      logger.error(`AWS getRegions failed: ${err.message}`);
      return [this._region];
    }
  }

  async getResources() {
    if (!this.configured) throw new Error("AWS credentials not configured");
    const { EC2Client, DescribeInstancesCommand } = this._requireSdk("@aws-sdk/client-ec2");
    const client = new EC2Client({ region: this._region, credentials: this._credentials });

    const result = await client.send(new DescribeInstancesCommand({}));
    const resources = [];

    for (const reservation of result.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        const nameTag = (instance.Tags || []).find(t => t.Key === "Name");
        resources.push({
          InstanceId: instance.InstanceId,
          Tags: { Name: nameTag ? nameTag.Value : instance.InstanceId },
          InstanceType: instance.InstanceType,
          State: instance.State?.Name || "unknown",
          Region: this._region,
          Platform: instance.PlatformDetails || "Linux/UNIX"
        });
      }
    }
    return resources;
  }

  async getMetrics(rawResource) {
    if (!this.configured) throw new Error("AWS credentials not configured");
    const { CloudWatchClient, GetMetricDataCommand } = this._requireSdk("@aws-sdk/client-cloudwatch");
    const client = new CloudWatchClient({ region: this._region, credentials: this._credentials });

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // last 10 minutes
    const dimensionValue = rawResource.InstanceId;

    const metricQuery = (id, metricName) => ({
      Id: id,
      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: metricName,
          Dimensions: [{ Name: "InstanceId", Value: dimensionValue }]
        },
        Period: 300,
        Stat: "Average"
      },
      ReturnData: true
    });

    const command = new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: [
        metricQuery("cpu", "CPUUtilization"),
        metricQuery("netIn", "NetworkIn"),
        metricQuery("netOut", "NetworkOut")
      ]
    });

    const result = await client.send(command);
    const byId = Object.fromEntries((result.MetricDataResults || []).map(r => [r.Id, r.Values?.[0] ?? null]));

    return {
      CPUUtilization: byId.cpu ?? null,
      // EC2 does not expose guest-level memory/disk via CloudWatch without the CloudWatch Agent installed
      // on the instance - left null rather than fabricated, per canonical-model rules (TRD Section 21-22).
      MemoryUtilization: null,
      DiskUtilization: null,
      NetworkIn: byId.netIn ?? null,
      NetworkOut: byId.netOut ?? null,
      InstanceState: rawResource.State,
      Timestamp: endTime
    };
  }

  async getCostData() {
    if (!env.aws.enableCostExplorer) {
      return []; // Cost Explorer costs $0.01/request - disabled by default, see TRD Section 17.
    }
    if (!this.configured) throw new Error("AWS credentials not configured");
    const { CostExplorerClient, GetCostAndUsageCommand } = this._requireSdk("@aws-sdk/client-cost-explorer");
    const client = new CostExplorerClient({ region: "us-east-1", credentials: this._credentials }); // Cost Explorer is a global/us-east-1 endpoint

    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    const fmt = (d) => d.toISOString().slice(0, 10);

    const result = await client.send(new GetCostAndUsageCommand({
      TimePeriod: { Start: fmt(start), End: fmt(end) },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"]
    }));

    const amount = result.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount;
    if (!amount) return [];

    return [{
      provider: "AWS",
      amount: Math.round(parseFloat(amount) * 100) / 100,
      currency: result.ResultsByTime[0].Total.UnblendedCost.Unit || "USD",
      isEstimated: false,
      source: "AWS_BILLING_API"
    }];
  }
}

module.exports = AWSAdapter;
