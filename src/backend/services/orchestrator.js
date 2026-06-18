/**
 * Workflow orchestrator for the ecommerce multi-agent demo.
 *
 * Current demo scope:
 * - Orchestrates predefined ecommerce workflows.
 * - Simulates agent latency and output with setTimeout + templates.
 * - Persists workflow/task records to SQLite.
 *
 * Production direction:
 * - Replace simulateStepOutput with real LLM calls and MCP/tool calls.
 * - Add schema validation, retry policy, permission checks, and workflow versioning.
 */

const { v4: uuid } = require('uuid');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { getDb } = require('../db/database');
const { setAgentStatus, setAgentUtilization } = require('./agent-manager');

const CONFIG_PATH = path.join(__dirname, '..', '..', '..', 'config', 'workflows.yaml');

const BUILTIN_WORKFLOWS = {
  new_product: {
    name: '新品上架',
    totalEstimate: '25 分钟',
    traditionalTime: '约 2 天',
    steps: [
      { id: 'info_collect', name: '信息收集', agent: 'manager', duration: 2000, desc: '引导商家补充商品名称、类目、卖点、价格带和目标人群' },
      { id: 'task_decompose', name: '任务拆解', agent: 'manager', duration: 1500, desc: '识别依赖关系，并分配给美工、文案、运营、仓储 Agent' },
      {
        id: 'parallel_work',
        name: '并行处理',
        agent: 'parallel',
        duration: 8000,
        desc: '美工、文案、运营并行生成上架所需素材和策略',
        parallel: [
          { agent: 'designer', task: '生成商品主图、细节图、场景图和包装图', output: '商品图 5 张，覆盖主图、细节、场景、对比和包装视角' },
          { agent: 'copywriter', task: '撰写标题、卖点和详情页文案', output: '标题 5 条，详情页文案 1200 字，SEO 关键词 7 个' },
          { agent: 'operator', task: '分析竞品价格并给出定价建议', output: '建议定价 89 元，参考竞品均价 102 元，并给出首发促销建议' },
        ],
      },
      { id: 'inventory_set', name: '库存设置', agent: 'warehouse', duration: 1200, desc: '创建 SKU，设置初始库存和安全库存阈值' },
      { id: 'quality_check', name: '质量审核', agent: 'manager', duration: 1800, desc: '审核各 Agent 输出，检查是否满足上架条件' },
      { id: 'publish', name: '一键上架', agent: 'operator', duration: 3000, desc: '模拟调用平台工具完成商品上架' },
      { id: 'report', name: '结果汇报', agent: 'manager', duration: 1000, desc: '汇总产出物和待人工确认项' },
    ],
  },
  promotion: {
    name: '促销活动策划',
    totalEstimate: '约 1 天',
    traditionalTime: '约 1 周',
    steps: [
      { id: 'need_confirm', name: '需求确认', agent: 'manager', duration: 2000, desc: '确认活动目标、预算、时间范围和参与商品' },
      { id: 'data_analysis', name: '数据分析', agent: 'operator', duration: 4000, desc: '分析历史销售、客单价、转化率和竞品活动策略' },
      { id: 'plan_make', name: '方案制定', agent: 'operator', duration: 3000, desc: '制定满减、折扣、赠品和投放策略' },
      { id: 'plan_review', name: '方案审核', agent: 'manager', duration: 2000, desc: '审核 ROI、风险点和人工确认项' },
      {
        id: 'material_prep',
        name: '素材准备',
        agent: 'parallel',
        duration: 5000,
        desc: '美工和文案并行准备活动素材',
        parallel: [
          { agent: 'designer', task: '设计活动海报、Banner 和商品图角标', output: '活动海报、Banner、角标规范各 1 套' },
          { agent: 'copywriter', task: '撰写活动文案和推广话术', output: '活动标题、短信模板、直播话术和站内推广文案' },
        ],
      },
      { id: 'launch', name: '活动上线', agent: 'operator', duration: 3000, desc: '模拟配置活动规则并上线' },
      { id: 'tracking', name: '效果追踪', agent: 'operator', duration: 1000, desc: '生成活动监控看板和异常提醒' },
    ],
  },
  daily_ops: {
    name: '日常运营',
    totalEstimate: '自动化巡检',
    traditionalTime: '约 4 小时/天',
    steps: [
      { id: 'cs_service', name: '客服自动回复', agent: 'service', duration: 1500, desc: '处理待回复咨询并识别需人工升级的问题' },
      { id: 'finance_log', name: '财务记账', agent: 'finance', duration: 1500, desc: '汇总订单收支，更新利润数据' },
      { id: 'inventory_chk', name: '库存巡检', agent: 'warehouse', duration: 2000, desc: '检查 SKU 库存水位并提示补货风险' },
      { id: 'data_analysis', name: '数据分析', agent: 'operator', duration: 3000, desc: '汇总销售数据，识别异常波动' },
      { id: 'daily_report', name: '日报生成', agent: 'manager', duration: 2000, desc: '生成经营日报和待处理事项' },
    ],
  },
};

let activeExecutions = [];

function loadWorkflowConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};

  try {
    const parsed = yaml.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) || {};
    return parsed.workflows || parsed;
  } catch (error) {
    console.warn('[orchestrator] Failed to parse workflows.yaml, using built-in workflows:', error.message);
    return {};
  }
}

function normalizeWorkflowConfig(configWorkflow) {
  if (!configWorkflow || !Array.isArray(configWorkflow.steps)) return null;

  return {
    name: configWorkflow.name,
    totalEstimate: configWorkflow.totalEstimate || configWorkflow.total_estimate,
    traditionalTime: configWorkflow.traditionalTime || configWorkflow.traditional_time,
    steps: configWorkflow.steps,
  };
}

function getWorkflows() {
  const configWorkflows = loadWorkflowConfig();
  const merged = {};

  for (const [key, builtin] of Object.entries(BUILTIN_WORKFLOWS)) {
    const configWorkflow = normalizeWorkflowConfig(configWorkflows[key]);
    merged[key] = configWorkflow
      ? { ...builtin, ...configWorkflow }
      : builtin;
  }

  return merged;
}

function simulateStepOutput(step) {
  if (step.parallel) {
    return step.parallel
      .map((task) => `${task.agent}: ${task.output || task.task} - completed`)
      .join('\n');
  }

  return `${step.agent}: ${step.desc} - completed`;
}

function setBusy(step) {
  if (step.agent === 'parallel') {
    step.parallel.forEach((task) => setAgentStatus(task.agent, 'busy', task.task));
    return;
  }

  setAgentStatus(step.agent, 'busy', step.desc);
}

function setOnline(step) {
  if (step.agent === 'parallel') {
    step.parallel.forEach((task) => {
      setAgentStatus(task.agent, 'online', null);
      setAgentUtilization(task.agent, Math.floor(Math.random() * 40 + 40));
    });
    return;
  }

  setAgentStatus(step.agent, 'online', null);
  setAgentUtilization(step.agent, Math.floor(Math.random() * 30 + 30));
}

async function executeWorkflow(workflowType, inputText = '', onProgress) {
  const workflow = getWorkflows()[workflowType];
  if (!workflow) throw new Error(`Unknown workflow: ${workflowType}`);

  const executionId = uuid();
  const db = getDb();
  const startedAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO workflow_executions (id, workflow_type, input_text, status, started_at, agent_count)
    VALUES (?, ?, ?, 'running', ?, ?)
  `).run(executionId, workflowType, inputText, startedAt, workflow.steps.length);

  const state = {
    id: executionId,
    type: workflowType,
    name: workflow.name,
    steps: [],
    log: [],
    totalCost: 0,
    startTime: Date.now(),
    mock: true,
  };

  activeExecutions.push(state);

  for (let index = 0; index < workflow.steps.length; index += 1) {
    const step = workflow.steps[index];
    const stepStart = Date.now();

    onProgress?.({ type: 'step_start', step, stepIndex: index, totalSteps: workflow.steps.length, executionId });
    setBusy(step);

    await new Promise((resolve) => setTimeout(resolve, step.duration + Math.random() * 1000));

    const output = simulateStepOutput(step);
    const durationSeconds = Math.round((Date.now() - stepStart) / 1000);
    const logEntry = {
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agent: step.agent,
      text: output,
      duration: durationSeconds,
    };

    state.log.push(logEntry);
    state.totalCost += step.duration * 0.0001;

    db.prepare(`
      INSERT INTO agent_tasks (id, execution_id, agent_id, task_type, status, dispatch_mode, duration_seconds, result_text)
      VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)
    `).run(
      uuid(),
      executionId,
      step.agent,
      step.id,
      step.agent === 'parallel' ? 'parallel' : 'sequential',
      durationSeconds,
      output,
    );

    setOnline(step);

    state.steps.push({ ...step, output, duration: durationSeconds });
    onProgress?.({ type: 'step_done', step, stepIndex: index, totalSteps: workflow.steps.length, executionId, log: logEntry });
  }

  const totalSeconds = Math.round((Date.now() - state.startTime) / 1000);
  state.completed = true;
  state.totalDuration = `${Math.floor(totalSeconds / 60)} 分 ${totalSeconds % 60} 秒`;
  state.totalCost = Math.round(state.totalCost * 100) / 100;

  db.prepare(`
    UPDATE workflow_executions
    SET status = 'completed', completed_at = ?, total_duration_seconds = ?, total_cost_yuan = ?
    WHERE id = ?
  `).run(new Date().toISOString(), totalSeconds, state.totalCost, executionId);

  activeExecutions = activeExecutions.filter((execution) => execution.id !== executionId);
  onProgress?.({ type: 'workflow_complete', executionId, state });

  return state;
}

function getActiveExecution() {
  return activeExecutions[0] || null;
}

function getWorkflowDef(type) {
  return getWorkflows()[type] || null;
}

module.exports = {
  executeWorkflow,
  getActiveExecution,
  getWorkflowDef,
  getWorkflows,
};
