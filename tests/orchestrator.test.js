const { getAllAgents } = require('../src/backend/services/agent-manager');
const { getWorkflowDef, getWorkflows } = require('../src/backend/services/orchestrator');
const { closeDb } = require('../src/backend/db/database');

afterAll(() => {
  closeDb();
});

describe('agent manager', () => {
  test('returns seven ecommerce agents', () => {
    const agents = getAllAgents();

    expect(agents).toHaveLength(7);
    expect(agents.map((agent) => agent.id)).toEqual([
      'manager',
      'designer',
      'copywriter',
      'operator',
      'service',
      'finance',
      'warehouse',
    ]);
  });
});

describe('workflow orchestrator definitions', () => {
  test('loads core workflows', () => {
    const workflows = getWorkflows();

    expect(Object.keys(workflows)).toEqual(['new_product', 'promotion', 'daily_ops']);
  });

  test('loads new product workflow steps from config or fallback', () => {
    const workflow = getWorkflowDef('new_product');

    expect(workflow).toBeTruthy();
    expect(workflow.name).toBe('新品上架');
    expect(workflow.steps.length).toBeGreaterThanOrEqual(5);
    expect(workflow.steps.some((step) => step.agent === 'parallel')).toBe(true);
  });

  test('returns null for unknown workflow', () => {
    expect(getWorkflowDef('unknown')).toBeNull();
  });
});
