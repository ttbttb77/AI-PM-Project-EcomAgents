# AGENTS.md

## Project Summary

电商多 Agent 协同运营系统是一个面向中小电商商家的 **AI 产品原型 + 架构验证 Demo**。

项目目标不是证明已经上线产生业务结果，而是验证：

- 多 Agent 是否适合拆解复杂电商运营流程
- Orchestrator 中心编排是否能支撑串行 / 并行任务
- 前端页面、工作流状态、任务记录、数据看板是否能形成可演示闭环
- 后续接入真实 LLM API 和种子商家数据前，需要哪些指标口径和验证框架

## Demo Boundary

必须始终明确：

- Agent 输出是模拟的：`setTimeout + 模板文本`
- 经营数据是 mock/seed 数据
- 当前没有接入真实 LLM API、RAG、MCP 工具或电商平台 API
- 简历和文档中不要写“真实提升 GMV”“真实提效 95%”“已服务商家”等线上结果
- 可以写“可运行本地 Demo”“验证页面交互、流程闭环和指标口径”

> 当前版本是 Demo 验证阶段，重点验证多 Agent 工作流编排、状态流转、页面交互、任务记录和指标框架。Agent 输出与经营数据均为模拟数据，不代表真实线上业务结果。下一步会接入真实 LLM API、RAG 知识库、MCP 工具调用和种子商家数据，验证人工流程与 Agent 流程的真实差异。

## Product Positioning

目标用户：

- 中小电商商家
- 运营人手少，但需要处理新品上架、促销、客服、库存、财务等多角色任务

核心痛点：

- 角色多：文案、美工、运营、客服、财务、仓储协作复杂
- 链路长：新品上架和促销策划需要多个步骤
- 标准化弱：依赖个人经验，难以沉淀流程
- 响应慢：客服、库存、数据异常等任务需要及时处理

Agent 设计：

- 店长：意图理解、任务拆解、进度监控、结果汇总
- 美工：商品图、Banner、详情页视觉素材
- 文案：商品标题、详情页文案、SEO、活动文案
- 运营：数据分析、定价策略、促销方案
- 客服：咨询回复、售后处理、人工升级
- 财务：收支记录、利润计算、报表生成
- 仓储：库存监控、补货建议、发货追踪

核心工作流：

- 新品上架
- 促销活动
- 日常运营

## Resume Positioning

这个项目面向 AI 产品岗位，简历中应弱化“我做了后端”，强化：

- 业务场景定义
- 产品方案设计
- Agent 分工与编排机制
- Demo 原型验证
- 指标口径和后续试点框架

## Key Files

| Purpose | File |
| --- | --- |
| Project overview | `README.md` |
| Claude entry guide | `CLAUDE.md` |
| Server entry | `src/backend/server.js` |
| Workflow orchestrator | `src/backend/services/orchestrator.js` |
| Agent runtime state | `src/backend/services/agent-manager.js` |
| SQLite setup | `src/backend/db/database.js` |
| Workflow config | `config/workflows.yaml` |
| Agent prompt docs | `src/agents/*/SOUL.md` |
| Frontend pages | `src/frontend/pages/` |
| PRD and research | `docs/prd/` |
| Metrics docs | `docs/data/metrics-definition.md`, `docs/metrics/` |
| Tests | `tests/orchestrator.test.js` |

## Tech Stack

Actual current implementation:

- Frontend: static HTML/CSS/JS pages under `src/frontend/pages/`
- Backend: Express REST API + WebSocket
- Orchestration: custom `orchestrator.js`
- Database: SQLite via `better-sqlite3`
- Config: YAML workflow definitions
- Tests: Jest smoke tests

Not yet implemented:

- Real LLM API calls
- RAG retrieval
- MCP/tool calling to ecommerce platforms
- Real merchant data ingestion
- Production auth, permissions, tenant isolation, monitoring

## Common Commands

Use `npm.cmd` on Windows PowerShell when `npm` is blocked by execution policy.

```bash
npm.cmd install
npm.cmd run init-db
npm.cmd start
npm.cmd test
```

Main local URL:

```text
http://localhost:3000/pages/dashboard.html
```

Useful API checks:

```text
GET /api/health
GET /api/agents
GET /api/workflows
GET /api/dashboard
POST /api/chat
POST /api/workflows/new_product/start
```

## Development Rules

- Preserve the Demo boundary. Do not silently describe simulated data as real business results.
- Keep product-facing Chinese copy clear and professional.
- Use English identifiers for code, API paths, database fields, and tests.
- Prefer small, focused changes over broad rewrites.
- If adding a new workflow, update both `config/workflows.yaml` and relevant frontend entry points.
- If adding API behavior, add or update Jest smoke tests.
- Do not delete `data/ecommerce.db` unless explicitly requested.

## How To Explain Key Design Choices

Why Orchestrator instead of free agent-to-agent communication:

> Demo 阶段选择中心编排，是为了降低复杂度并提升可控性。中心编排可以明确任务责任、状态流转和审核节点，适合 MVP 验证。自由通信更灵活，但容易带来状态不一致和难以追踪的问题。

Why mock data still matters:

> Mock 数据不能证明业务效果，但能验证产品链路。它可以帮助检查页面展示、数据结构、指标口径、异常提示和工作流记录是否合理。真实业务效果需要下一阶段接入种子商家数据验证。

Why not emphasize backend in resume:

> AI 产品经理不需要把重点放在后端实现上。这里的后端是为了支撑可交互 Demo，核心价值是产品场景拆解、Agent 分工、编排机制、指标框架和验证路径。

## Next Iteration Priorities

1. 接入真实 LLM API，优先替换文案 Agent。
2. 为客服 Agent 增加 RAG 知识库和人工升级策略。
3. 将高风险动作加入人工确认节点，例如改价、退款、正式上架。
4. 扩展自动化测试，覆盖 API、工作流执行、数据库写入。
5. 使用 2-3 个种子商家做真实对照试点，采集人工流程与 Agent 流程差异。
