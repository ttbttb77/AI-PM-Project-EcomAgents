# 数据流设计

## 工作流执行数据流（新品上架示例）

```
商家输入 "我要上架保温杯"
  │
  ▼
[POST /api/workflows/new_product/start]
  │
  ▼
orchestrator.executeWorkflow()
  │
  ├─ Step 1: 信息采集 (manager)     → agent_tasks INSERT
  ├─ Step 2: 任务分解 (manager)     → agent_tasks INSERT
  ├─ Step 3: 并行处理
  │   ├─ designer  (setTimeout 模拟) → agent_tasks INSERT
  │   ├─ copywriter(setTimeout 模拟) → agent_tasks INSERT
  │   └─ operator  (setTimeout 模拟) → agent_tasks INSERT
  ├─ Step 4: 库存设置 (warehouse)   → agent_tasks INSERT
  ├─ Step 5: 质审     (manager)     → agent_tasks INSERT
  ├─ Step 6: 上架     (operator)    → agent_tasks INSERT
  └─ Step 7: 汇报     (manager)     → agent_tasks INSERT
  │
  ▼ (每步完成)
WebSocket 推送 → { type:'step_done', step, stepIndex, log }
  │
  ▼ (全部完成)
workflow_executions UPDATE → status='completed' + total_duration_seconds
WebSocket 推送 → { type:'workflow_complete', state }
```

## API 请求流

```
浏览器 → Express → 路由处理 → 数据库查询 → JSON 响应
                   │
                   ├─ GET  /api/agents       → agent-manager.js (内存)
                   ├─ GET  /api/dashboard    → SQLite SELECT
                   ├─ POST /api/chat         → 规则匹配回复
                   └─ POST /api/workflows/.../start → orchestrator.js
```

## WebSocket 消息流

```
Client                          Server
  │                                │
  │──── {type:'start_workflow'} ──→│ 触发 executeWorkflow()
  │                                │
  │←── {type:'step_start'} ───────│ 每步开始
  │←── {type:'step_done'}  ───────│ 每步完成
  │←── {type:'workflow_complete'}─│ 全部完成
  │←── {type:'workflow_error'} ───│ 异常
```

## 数据库 ER 简要

```
workflow_executions (1) ──── (N) agent_tasks
       │
       └── workflow_type: new_product | promotion | daily_ops
       
sales_daily (独立，31天Mock数据)

tracking_events (独立，埋点事件记录)
```
