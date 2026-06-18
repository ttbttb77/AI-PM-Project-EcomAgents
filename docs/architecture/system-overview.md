# 系统架构总览

## 架构全景

```
┌──────────────────────────────────────────────────────────────┐
│  商家（浏览器/CLI）                                            │
│  ├─ http://localhost:3000/pages/dashboard.html  (10页前端)     │
│  └─ npm run new-product  (CLI交互Demo)                        │
├──────────────────────────────────────────────────────────────┤
│  Express Server (src/backend/server.js)                       │
│  ├─ 静态文件 serve（src/frontend/pages/）                      │
│  ├─ REST API（/api/agents, /api/dashboard, /api/chat）        │
│  └─ WebSocket（工作流进度实时推送）                              │
├──────────────────────────────────────────────────────────────┤
│  编排层                                                       │
│  ├─ orchestrator.js — 工作流状态机 + 并行调度                   │
│  └─ agent-manager.js — 7 Agent 运行时状态 + 利用率              │
├──────────────────────────────────────────────────────────────┤
│  Agent 定义层                                                 │
│  ├─ src/agents/*/SOUL.md — 7 个 Agent 的 Prompt 模板           │
│  └─ config/agents.yaml — 模型/参数/能力/安全分级配置            │
├──────────────────────────────────────────────────────────────┤
│  数据层                                                       │
│  └─ SQLite (data/ecommerce.db) — better-sqlite3 封装           │
├──────────────────────────────────────────────────────────────┤
│  外部工具                                                     │
│  ├─ Codex CLI (gpt-5.5) — 数据分析子Agent（ACP委派模式）       │
│  └─ pm-analytics — 交互式HTML分析报告生成                      │
└──────────────────────────────────────────────────────────────┘
```

## Agent 间协作机制

- **编排模式**：Orchestrator（店长 Agent）作为中心控制器，接收任务 → 分解 → 分配给专精 Agent → 汇总结果
- **并行策略**：无依赖的 Agent 任务并行执行（如美工+文案+运营），有依赖的串行
- **通信方式**：进程内函数调用（当前Demo），计划支持 MCP 协议跨进程通信

## 当前 Demo 限制

- LLM 回复为 setTimeout 模拟，未接真实 API
- 工作流进度通过 WebSocket 推送到后端，前端 Dashboard 尚未集成 WebSocket 接收
- 无真实的多租户隔离
