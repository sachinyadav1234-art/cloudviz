const { generateDemoResources } = require("./resourceGenerator");
const { generateDemoMetric } = require("./metricGenerator");
const { generateDemoCost } = require("./costGenerator");

/**
 * DemoAdapter implements the same CloudProviderAdapter contract as AWSAdapter/OCIAdapter,
 * so the rest of the application never needs to know it's not talking to a real cloud.
 */
class DemoAdapter {
  constructor() {
    this._resources = generateDemoResources();
  }

  async testConnection() {
    return { success: true, message: "Demo Mode is always available" };
  }

  async getRegions() {
    return [...new Set(this._resources.map(r => r.region))];
  }

  async getResources() {
    return this._resources;
  }

  async getMetrics(resource) {
    return generateDemoMetric(resource);
  }

  async getCostData() {
    const awsCount = this._resources.filter(r => r.resourceId.startsWith("demo-aws")).length;
    const ociCount = this._resources.filter(r => r.resourceId.startsWith("demo-oci")).length;
    return [
      generateDemoCost("AWS", awsCount),
      generateDemoCost("OCI", ociCount)
    ];
  }
}

module.exports = DemoAdapter;
