-- ============================================================
-- 电商多Agent系统 — Demo 数据库表结构
-- 基于 PRD v1.1 §9 数据模型 + Tutorial Phase 4 融合
-- 使用 SQLite（Demo 阶段，生产环境迁移 PostgreSQL）
-- ============================================================

-- -----------------------------------------------------------
-- 工作流执行记录表
-- -----------------------------------------------------------
CREATE TABLE workflow_executions (
    id              TEXT PRIMARY KEY,
    workflow_type   TEXT NOT NULL CHECK(workflow_type IN ('new_product','promotion','daily_ops')),
    user_id         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','completed','failed','cancelled')),
    input_text      TEXT,                           -- 商家原始输入
    started_at       TEXT NOT NULL,                  -- ISO 8601
    completed_at     TEXT,
    total_duration_seconds INTEGER,
    agent_count     INTEGER DEFAULT 0,
    human_intervention_count INTEGER DEFAULT 0,
    output_quality_score REAL CHECK(output_quality_score >= 0 AND output_quality_score <= 10),
    total_tokens_used INTEGER,
    total_cost_yuan REAL,
    output_summary  TEXT,                           -- Manager 最终汇报摘要
    created_at      TEXT DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------
-- Agent 任务记录表
-- -----------------------------------------------------------
CREATE TABLE agent_tasks (
    id              TEXT PRIMARY KEY,
    execution_id    TEXT NOT NULL REFERENCES workflow_executions(id),
    agent_id        TEXT NOT NULL CHECK(agent_id IN ('manager','designer','copywriter','operator','service','finance','warehouse')),
    task_type       TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','completed','failed')),
    dispatch_mode   TEXT DEFAULT 'sequential' CHECK(dispatch_mode IN ('sequential','parallel')),
    dispatched_at    TEXT,
    completed_at     TEXT,
    duration_seconds INTEGER,
    retry_count     INTEGER DEFAULT 0,
    quality_score   REAL CHECK(quality_score >= 0 AND quality_score <= 10),
    result_text     TEXT,
    error_message   TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------
-- 埋点事件表（通用事件记录）
-- -----------------------------------------------------------
CREATE TABLE tracking_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name      TEXT NOT NULL,
    category        TEXT NOT NULL CHECK(category IN ('user_behavior','workflow_execution','customer_service','system_technical','quality')),
    user_id         TEXT,
    session_id      TEXT,
    workflow_id     TEXT,
    properties      TEXT,                           -- JSON string
    timestamp       TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_tracking_event_time ON tracking_events(event_name, timestamp);
CREATE INDEX idx_tracking_user ON tracking_events(user_id, timestamp);
CREATE INDEX idx_tracking_workflow ON tracking_events(workflow_id);

-- -----------------------------------------------------------
-- 客服会话表
-- -----------------------------------------------------------
CREATE TABLE sessions (
    id              TEXT PRIMARY KEY,
    platform        TEXT NOT NULL CHECK(platform IN ('taobao','jd','douyin','web')),
    customer_id     TEXT NOT NULL,
    customer_name   TEXT,
    status          TEXT DEFAULT 'active' CHECK(status IN ('active','closed')),
    channel         TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    closed_at       TEXT
);

-- 客服消息表
CREATE TABLE messages (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL REFERENCES sessions(id),
    sender_type     TEXT NOT NULL CHECK(sender_type IN ('customer','agent','human')),
    content         TEXT NOT NULL,
    intent          TEXT,
    confidence      REAL,
    sentiment       TEXT CHECK(sentiment IN ('satisfied','neutral','dissatisfied','angry')),
    is_escalated    INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------
-- 评测相关表
-- -----------------------------------------------------------
CREATE TABLE evaluation_runs (
    id              TEXT PRIMARY KEY,
    eval_set_version TEXT NOT NULL,
    agent_type      TEXT NOT NULL,
    total_cases     INTEGER NOT NULL,
    total_score     REAL,
    accuracy_score  REAL,
    safety_score    REAL,
    pass            INTEGER,
    trigger_reason  TEXT,
    run_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE bad_cases (
    id              TEXT PRIMARY KEY,
    agent_type      TEXT NOT NULL,
    scene           TEXT,
    failure_reason  TEXT CHECK(failure_reason IN ('intent_error','rag_recall_fail','hallucination','format_error','safety_violation')),
    severity        TEXT DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
    input_text      TEXT NOT NULL,
    actual_output   TEXT NOT NULL,
    expected_output TEXT,
    status          TEXT DEFAULT 'open' CHECK(status IN ('open','analyzing','resolved','closed')),
    added_to_eval   INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),
    resolved_at     TEXT
);

-- -----------------------------------------------------------
-- Mock 数据：30 天销售趋势
-- -----------------------------------------------------------
CREATE TABLE sales_daily (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    date            TEXT NOT NULL UNIQUE,
    gmv             REAL NOT NULL,          -- 销售额
    order_count     INTEGER NOT NULL,       -- 订单数
    avg_order_value REAL NOT NULL,          -- 客单价
    conversion_rate REAL NOT NULL,          -- 转化率
    refund_rate     REAL NOT NULL,          -- 退款率
    created_at      TEXT DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------
-- Mock 数据插入（Demo 用）
-- -----------------------------------------------------------
INSERT INTO sales_daily (date, gmv, order_count, avg_order_value, conversion_rate, refund_rate) VALUES
('2026-05-18', 8920, 105, 84.95, 3.2, 3.1),
('2026-05-19', 9340, 112, 83.39, 3.3, 2.8),
('2026-05-20', 10200, 118, 86.44, 3.5, 3.0),
('2026-05-21', 9800, 115, 85.22, 3.4, 3.2),
('2026-05-22', 11300, 130, 86.92, 3.7, 2.5),
('2026-05-23', 12500, 140, 89.29, 3.8, 2.9),
('2026-05-24', 11800, 135, 87.41, 3.6, 3.0),
('2026-05-25', 10800, 122, 88.52, 3.5, 2.7),
('2026-05-26', 10500, 120, 87.50, 3.4, 3.1),
('2026-05-27', 11200, 128, 87.50, 3.6, 2.8),
('2026-05-28', 12000, 138, 86.96, 3.7, 2.6),
('2026-05-29', 13100, 148, 88.51, 3.9, 2.4),
('2026-05-30', 12800, 145, 88.28, 3.8, 2.7),
('2026-05-31', 11500, 132, 87.12, 3.6, 3.0),
('2026-06-01', 14200, 155, 91.61, 4.0, 2.3),
('2026-06-02', 13800, 150, 92.00, 3.9, 2.5),
('2026-06-03', 12600, 140, 90.00, 3.8, 2.8),
('2026-06-04', 13200, 148, 89.19, 3.9, 2.6),
('2026-06-05', 14000, 158, 88.61, 4.1, 2.4),
('2026-06-06', 13500, 152, 88.82, 4.0, 2.5),
('2026-06-07', 12900, 145, 88.97, 3.9, 2.7),
('2026-06-08', 11800, 135, 87.41, 3.7, 3.0),
('2026-06-09', 12400, 140, 88.57, 3.8, 2.8),
('2026-06-10', 13600, 155, 87.74, 4.0, 2.5),
('2026-06-11', 14300, 160, 89.38, 4.2, 2.3),
('2026-06-12', 15000, 168, 89.29, 4.3, 2.2),
('2026-06-13', 14600, 162, 90.12, 4.2, 2.4),
('2026-06-14', 13900, 155, 89.68, 4.1, 2.5),
('2026-06-15', 14800, 165, 89.70, 4.3, 2.3),
('2026-06-16', 15200, 170, 89.41, 4.4, 2.1),
('2026-06-17', 12580, 142, 88.59, 3.8, 5.2);
