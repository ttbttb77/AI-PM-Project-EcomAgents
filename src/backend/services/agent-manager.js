/**
 * Agent runtime state manager.
 *
 * Demo scope:
 * - Keeps in-memory status for 7 ecommerce agents.
 * - Does not call real LLM APIs yet.
 */

const agents = new Map([
  ['manager', {
    id: 'manager',
    name: '店长',
    icon: '👑',
    role: '总协调、任务分配、结果汇总',
    status: 'online',
    currentTask: null,
    utilization: 42,
    model: 'DeepSeek-V3',
    temp: 0.7,
  }],
  ['designer', {
    id: 'designer',
    name: '美工',
    icon: '🎨',
    role: '商品图、Banner、详情页设计',
    status: 'online',
    currentTask: null,
    utilization: 83,
    model: 'DeepSeek-V3 / 图像模型',
    temp: 0.8,
  }],
  ['copywriter', {
    id: 'copywriter',
    name: '文案',
    icon: '✍️',
    role: '商品标题、详情页文案、SEO',
    status: 'online',
    currentTask: null,
    utilization: 65,
    model: 'DeepSeek-V3',
    temp: 0.8,
  }],
  ['operator', {
    id: 'operator',
    name: '运营',
    icon: '📊',
    role: '数据分析、定价策略、活动策划',
    status: 'online',
    currentTask: null,
    utilization: 55,
    model: 'DeepSeek-V3',
    temp: 0.5,
  }],
  ['service', {
    id: 'service',
    name: '客服',
    icon: '💬',
    role: '咨询回复、售后处理、工单升级',
    status: 'online',
    currentTask: null,
    utilization: 72,
    model: 'DeepSeek-V3',
    temp: 0.7,
  }],
  ['finance', {
    id: 'finance',
    name: '财务',
    icon: '💰',
    role: '收支记录、利润计算、报表生成',
    status: 'online',
    currentTask: null,
    utilization: 35,
    model: 'DeepSeek-V3',
    temp: 0.3,
  }],
  ['warehouse', {
    id: 'warehouse',
    name: '仓储',
    icon: '📦',
    role: '库存监控、补货建议、发货追踪',
    status: 'online',
    currentTask: null,
    utilization: 28,
    model: 'DeepSeek-V3',
    temp: 0.4,
  }],
]);

function getAllAgents() {
  return Array.from(agents.values());
}

function getAgent(id) {
  return agents.get(id) || null;
}

function setAgentStatus(id, status, currentTask = null) {
  const agent = agents.get(id);
  if (!agent) return null;

  agent.status = status;
  agent.currentTask = currentTask;
  return agent;
}

function setAgentUtilization(id, utilization) {
  const agent = agents.get(id);
  if (!agent) return null;

  agent.utilization = utilization;
  return agent;
}

module.exports = {
  getAllAgents,
  getAgent,
  setAgentStatus,
  setAgentUtilization,
};
