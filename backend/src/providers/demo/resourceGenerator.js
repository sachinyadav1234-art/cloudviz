const REGIONS_AWS = ["ap-south-1 (Mumbai)", "ap-southeast-1 (Singapore)", "eu-west-2 (London)"];
const REGIONS_OCI = ["ap-hyderabad-1", "ap-mumbai-1", "uk-london-1"];

function generateDemoResources() {
  const resources = [];

  const awsNames = ["Web-Server-01", "Web-Server-02", "API-Backend-01", "API-Backend-02", "Worker-Node-01",
    "Worker-Node-02", "Cache-Node-01", "DB-Replica-01", "Batch-Processor-01", "Storage-Volume-01"];
  awsNames.forEach((name, i) => {
    resources.push({
      resourceId: `demo-aws-${String(i + 1).padStart(3, "0")}`,
      resourceName: name,
      resourceType: i === 9 ? "STORAGE" : "COMPUTE",
      region: REGIONS_AWS[i % REGIONS_AWS.length],
      status: "running",
      metadata: { instanceType: "t3.micro", os: "Linux" },
      // used to drive the metric generator deterministically per resource
      scenario: i === 4 ? "UNDER_UTILIZATION" : i === 8 ? "CPU_SPIKE" : "HEALTHY"
    });
  });

  const ociNames = ["VM-Compute-01", "VM-Compute-02", "VM-Compute-03", "VM-Compute-04", "Block-Storage-01",
    "Block-Storage-02", "App-Node-01", "App-Node-02"];
  ociNames.forEach((name, i) => {
    resources.push({
      resourceId: `demo-oci-${String(i + 1).padStart(3, "0")}`,
      resourceName: name,
      resourceType: i >= 4 && i <= 5 ? "STORAGE" : "COMPUTE",
      region: REGIONS_OCI[i % REGIONS_OCI.length],
      status: "running",
      metadata: { shape: "VM.Standard.E4.Flex" },
      scenario: i === 3 ? "MEMORY_SPIKE" : i === 5 ? "STORAGE_PRESSURE" : "HEALTHY"
    });
  });

  return resources;
}

module.exports = { generateDemoResources };
