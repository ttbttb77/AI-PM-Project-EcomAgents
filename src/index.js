#!/usr/bin/env node

/**
 * 电商多Agent协同系统
 * ============================================================
 * 基于 MCP 协议 + Orchestrator 架构
 * 7 个专业 Agent 协同完成电商运营全流程自动化
 *
 * Agent 团队
 * ├─ 👔 店长 (Manager)     — 总指挥、任务分配、决策
 * ├─ 🎨 美工 (Designer)    — 商品图、Banner、详情页
 * ├─ ✍️ 文案 (Copywriter)  — 商品文案、标题、SEO
 * ├─ 📊 运营 (Operator)    — 数据分析、定价、活动策划
 * ├─ 💬 客服 (Service)     — 自动回复、工单、售后
 * ├─ 💰 财务 (Finance)     — 收支、利润、报表
 * └─ 📦 仓储 (Warehouse)   — 库存、补货、发货
 *
 * 三大核心工作流
 * ├─ 新品上架   — 25 分钟完成（传统 2 天，提效 95%）
 * ├─ 促销活动   — 1 天完成（传统 1 周，提效 85%）
 * └─ 日常运营   — 全自动化（传统 4h/天，提效 90%+）
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// 加载配置
const agentsConfigPath = path.join(__dirname, '..', 'config', 'agents.yaml');
const workflowsConfigPath = path.join(__dirname, '..', 'config', 'workflows.yaml');

const agentsConfig = yaml.parse(fs.readFileSync(agentsConfigPath, 'utf8'));
const workflowsConfig = yaml.parse(fs.readFileSync(workflowsConfigPath, 'utf8'));

// 横幅
const BANNER = `
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║         🏪 电商多 Agent 协同系统 v1.0                             ║
║         E-commerce Multi-Agent Collaboration System              ║
║                                                                  ║
║         基于 MCP + Orchestrator，7 个 Agent 协同自动化            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`;

/**
 * 打印 Agent 团队信息
 */
function printAgentTeam() {
  console.log('🤖 Agent 团队：\n');
  const icon = { manager: '👔', designer: '🎨', copywriter: '✍️', operator: '📊', service: '💬', finance: '💰', warehouse: '📦' };

  for (const [id, agent] of Object.entries(agentsConfig.agents)) {
    const emoji = icon[id] || '🤖';
    const capabilities = agent.capabilities?.map(c => c.replace(/_/g, ' ')).join(' / ') || '';
    console.log(`  ${emoji}  ${agent.name.padEnd(6)} — ${agent.role}`);
    if (capabilities) {
      console.log(`      ${capabilities}`);
    }
    console.log('');
  }
}

/**
 * 打印工作流信息
 */
function printWorkflows() {
  console.log('📋 核心工作流：\n');

  for (const [id, wf] of Object.entries(workflowsConfig)) {
    if (id === 'defaults') continue;
    console.log(`  🔹 ${wf.name}`);
    console.log(`     触发词：${wf.trigger_keywords?.join(' / ') || wf.trigger_type || 'N/A'}`);
    console.log(`     参与 Agent：${wf.agents?.join(' → ') || 'N/A'}`);
    console.log(`     预估耗时：${wf.total_estimate || 'N/A'}`);
    console.log(`     传统耗时：${wf.traditional_time || 'N/A'}`);
    console.log(`     效率提升：${wf.efficiency_gain || 'N/A'}`);
    console.log('');
  }
}

/**
 * 打印文档索引
 */
function printDocs() {
  console.log('📚 项目文档：\n');
  console.log('  📄 PRD v1.1（AI增强版） — docs/prd/产品需求文档-PRD-v1.1.md');
  console.log('  📄 PRD v1.0（经典版）   — docs/prd/产品需求文档-PRD.md');
  console.log('  📊 RICE 优先级排序      — docs/prd/功能优先级排序-RICE 模型.md');
  console.log('  📊 行业调研报告          — docs/prd/电商 AI Agent 行业调研报告 2025-2026.md');
  console.log('');
  console.log('  🎨 前端原型（10 页完成） — src/frontend/pages/');
  console.log('  📐 架构设计              — docs/architecture/');
  console.log('  📈 数据埋点              — docs/data/');
  console.log('');
}

/**
 * 打印快速开始
 */
function printQuickStart() {
  console.log('🚀 快速开始：\n');
  console.log('  npm run new-product     # 启动新品上架工作流');
  console.log('  npm run promotion       # 启动促销活动工作流');
  console.log('  npm run daily-ops       # 启动日常运营工作流');
  console.log('');
  console.log('  npm start               # 启动系统（交互式）');
  console.log('  npm run dev              # 开发模式（热重载）');
  console.log('');
  console.log('💡 提示：');
  console.log('  1. 请先配置环境变量：cp .env.example .env');
  console.log('  2. 填写 API 密钥和平台配置');
  console.log('  3. 在 config/agents.yaml 中调整 Agent 参数');
  console.log('  4. 参考 README.md 了解完整使用方式');
  console.log('');
}

/**
 * 初始化项目目录
 */
function ensureDirectories() {
  const dirs = [
    'data',
    'logs',
    'src/agents/manager',
    'src/agents/designer',
    'src/agents/copywriter',
    'src/agents/operator',
    'src/agents/service',
    'src/agents/finance',
    'src/agents/warehouse',
    'src/workflows',
    'src/mcp-tools',
    'src/services',
    'src/frontend',
    'tests/unit',
    'tests/integration',
    'tests/e2e',
    'scripts/setup',
    'scripts/deploy',
    'scripts/monitor',
  ];

  for (const dir of dirs) {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(BANNER);

  // 确保目录结构
  ensureDirectories();

  // 打印系统信息
  printAgentTeam();
  printWorkflows();
  printDocs();
  printQuickStart();

  console.log('✨ 电商多 Agent 协同系统已就绪，祝您的电商生意蒸蒸日上！\n');
}

// CLI 入口
if (require.main === module) {
  main().catch(err => {
    console.error('❌ 系统启动失败:', err.message);
    process.exit(1);
  });
}

module.exports = {
  agentsConfig,
  workflowsConfig,
  main,
};
