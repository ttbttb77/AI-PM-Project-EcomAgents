#!/usr/bin/env node
/**
 * Ecommerce multi-agent demo server.
 *
 * Demo boundary:
 * - Agent execution is simulated by the orchestrator.
 * - Sales data is seeded mock data.
 * - REST/WebSocket/database flows are real and can be used for product demos.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
const { initDb, getDb } = require('./db/database');
const { getAllAgents } = require('./services/agent-manager');
const {
  executeWorkflow,
  getWorkflowDef,
  getActiveExecution,
  getWorkflows,
} = require('./services/orchestrator');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

function broadcast(event) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify(event));
  });
}

app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    data: {
      status: 'ok',
      demoMode: true,
      mockData: true,
      message: 'Demo server is running. Agent output and sales data are simulated.',
    },
  });
});

app.get('/api/agents', (req, res) => {
  res.json({ code: 0, data: getAllAgents() });
});

app.get('/api/workflows', (req, res) => {
  res.json({ code: 0, data: getWorkflows() });
});

app.get('/api/workflows/:type', (req, res) => {
  const workflow = getWorkflowDef(req.params.type);
  if (!workflow) {
    res.status(404).json({ code: 40401, message: 'Workflow not found' });
    return;
  }

  res.json({ code: 0, data: workflow });
});

app.post('/api/workflows/:type/start', async (req, res) => {
  const { type } = req.params;
  const { input_text: inputText = '' } = req.body || {};

  if (!getWorkflowDef(type)) {
    res.status(404).json({ code: 40401, message: 'Workflow not found' });
    return;
  }

  res.json({
    code: 0,
    message: 'Workflow started',
    data: { type, inputText, demoMode: true },
  });

  try {
    const state = await executeWorkflow(type, inputText, broadcast);
    broadcast({ type: 'workflow_complete', state });
  } catch (error) {
    broadcast({ type: 'workflow_error', error: error.message });
  }
});

app.get('/api/dashboard', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const salesToday = db.prepare('SELECT * FROM sales_daily WHERE date = ?').get(today)
    || db.prepare('SELECT * FROM sales_daily ORDER BY date DESC LIMIT 1').get()
    || {
      date: today,
      gmv: 12580,
      order_count: 142,
      avg_order_value: 88.6,
      conversion_rate: 3.8,
      refund_rate: 5.2,
    };

  const recentSales = db.prepare('SELECT date, gmv FROM sales_daily ORDER BY date DESC LIMIT 14').all().reverse();

  res.json({
    code: 0,
    data: {
      demoMode: true,
      dataSource: 'mock_seed_data',
      agents: getAllAgents(),
      salesToday,
      recentSales,
      activeWorkflow: getActiveExecution(),
    },
  });
});

app.post('/api/chat', (req, res) => {
  const { message = '' } = req.body || {};
  const normalizedMessage = message.trim().toLowerCase();

  if (!normalizedMessage) {
    res.status(400).json({ code: 40001, message: 'Message cannot be empty' });
    return;
  }

  let reply = '收到。我是店长 Agent，可以帮你启动新品上架、促销策划、数据看板和日常运营流程。';

  if (normalizedMessage.includes('上架') || normalizedMessage.includes('新品')) {
    reply = '可以，我会启动新品上架流程，并协调美工、文案、运营和仓储 Agent 准备素材、定价和库存信息。';
  } else if (normalizedMessage.includes('促销') || normalizedMessage.includes('活动') || normalizedMessage.includes('618')) {
    reply = '可以，我会启动促销策划流程，先确认活动目标、预算、时间范围和参与商品，再生成活动方案。';
  } else if (normalizedMessage.includes('数据') || normalizedMessage.includes('看板')) {
    reply = '当前看板使用 31 天模拟经营数据，用于验证 GMV、订单、转化率、退款率和异常提醒等指标链路。';
  } else if (normalizedMessage.includes('库存') || normalizedMessage.includes('补货')) {
    reply = '仓储 Agent 会检查 SKU 库存水位，并对低于安全库存阈值的商品给出补货建议。';
  } else if (normalizedMessage.includes('mock') || normalizedMessage.includes('真实')) {
    reply = '当前 Demo 的 Agent 输出和经营数据均为模拟数据，主要用于验证工作流编排、页面交互和指标框架。';
  }

  res.json({
    code: 0,
    data: {
      role: 'agent',
      reply,
      demoMode: true,
      timestamp: new Date().toISOString(),
    },
  });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'connected',
    demoMode: true,
    agents: getAllAgents(),
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type !== 'start_workflow') return;

      executeWorkflow(message.workflow_type, message.input_text || '', (event) => {
        if (ws.readyState === 1) ws.send(JSON.stringify(event));
      })
        .then((state) => {
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'workflow_complete', state }));
        })
        .catch((error) => {
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'workflow_error', error: error.message }));
        });
    } catch (error) {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'invalid_message', error: error.message }));
    }
  });
});

const PORT = process.env.PORT || 3000;

initDb();
server.listen(PORT, () => {
  console.log(`Ecommerce multi-agent demo server running at http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/pages/dashboard.html`);
  console.log('Demo note: agent output and sales data are simulated.');
});
