# API 接口规范

所有 API 以 `http://localhost:3000` 为 base。

## REST API

### GET /api/agents
返回 7 个 Agent 的当前状态。

```json
{"code":0,"data":[{"id":"manager","name":"店长","icon":"👔","status":"online","utilization":42}, ...]}
```

### GET /api/dashboard
返回仪表盘聚合数据。

```json
{"code":0,"data":{"agents":[...],"salesToday":{"gmv":12580,...},"recentSales":[...],"activeWorkflow":null}}
```

### POST /api/chat
发送消息给店长 Agent。

```json
// Request
{"message":"今天卖了多少？"}

// Response
{"code":0,"data":{"reply":"📊 今日速报：销售额 ¥12,580...","role":"agent","timestamp":"..."}}
```

### POST /api/workflows/:type/start
启动工作流。`:type` = `new_product` | `promotion` | `daily_ops`

```json
// Request
{"input_text":"上架304不锈钢保温杯"}

// Response（立即返回，工作流异步执行）
{"code":0,"message":"工作流已启动","data":{"type":"new_product","input_text":"..."}}
```

进度通过 WebSocket 实时推送。

---

## WebSocket 消息格式

### 客户端 → 服务端
```json
{"type":"start_workflow","workflow_type":"new_product","input_text":"..."}
```

### 服务端 → 客户端

**连接确认**
```json
{"type":"connected","agents":[...]}
```

**步骤开始**
```json
{"type":"step_start","step":{"id":"parallel_work","name":"并行处理","agent":"parallel","duration":8000},"stepIndex":2,"totalSteps":7,"executionId":"uuid"}
```

**步骤完成**
```json
{"type":"step_done","step":{...},"stepIndex":2,"totalSteps":7,"executionId":"uuid","log":{"time":"10:08","agent":"🎨","text":"美工完成5张商品图","duration":5}}
```

**工作流完成**
```json
{"type":"workflow_complete","state":{"id":"uuid","completed":true,"totalDuration":"0 分 21 秒","log":[...],"steps":[...]}}
```

---

## 错误码

| 错误码 | 含义 |
|:------:|------|
| 0 | 成功 |
| 40001 | 参数缺失/无效 |
| 40401 | 资源不存在（如未知工作流类型） |
| 50001 | 服务内部错误 |
