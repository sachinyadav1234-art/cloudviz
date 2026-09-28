// Predefined demo scenarios - each returns a CPU/memory/storage generator function.
const SCENARIOS = {
  HEALTHY: () => ({
    cpu: 35 + Math.random() * 15,
    memory: 40 + Math.random() * 15,
    storage: 45 + Math.random() * 10
  }),
  CPU_SPIKE: () => ({
    cpu: 85 + Math.random() * 13,
    memory: 55 + Math.random() * 15,
    storage: 50 + Math.random() * 10
  }),
  MEMORY_SPIKE: () => ({
    cpu: 45 + Math.random() * 15,
    memory: 88 + Math.random() * 10,
    storage: 50 + Math.random() * 10
  }),
  STORAGE_PRESSURE: () => ({
    cpu: 40 + Math.random() * 15,
    memory: 45 + Math.random() * 15,
    storage: 92 + Math.random() * 7
  }),
  UNDER_UTILIZATION: () => ({
    cpu: 5 + Math.random() * 8,
    memory: 10 + Math.random() * 10,
    storage: 20 + Math.random() * 15
  })
};

function pickScenario(name) {
  return SCENARIOS[name] || SCENARIOS.HEALTHY;
}

module.exports = { SCENARIOS, pickScenario };
