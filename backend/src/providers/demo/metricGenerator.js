const { pickScenario } = require("./scenarios");

function generateDemoMetric(resource) {
  const scenarioFn = pickScenario(resource.scenario || "HEALTHY");
  const { cpu, memory, storage } = scenarioFn();

  return {
    cpuUsage: Math.round(cpu * 10) / 10,
    memoryUsage: Math.round(memory * 10) / 10,
    storageUsage: Math.round(storage * 10) / 10,
    networkIn: Math.round(200 + Math.random() * 400),
    networkOut: Math.round(100 + Math.random() * 300),
    status: "running",
    timestamp: new Date()
  };
}

module.exports = { generateDemoMetric };
