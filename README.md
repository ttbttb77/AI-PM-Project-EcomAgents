# 电商多 Agent 系统

一个基于多 Agent 架构的电商系统，通过多个 specialized agents 协同工作来处理电商场景中的各种任务。

## 项目结构

```
电商多 agent/
├── docs/                    # 项目文档
│   ├── prd/                # 产品需求文档
│   ├── prototype/          # 原型设计
│   ├── architecture/       # 架构设计文档
│   ├── data/               # 数据文档
│   └── metrics/            # 指标定义
├── src/                     # 源代码
│   ├── agents/             # Agent 实现
│   ├── workflows/          # 工作流定义
│   ├── mcp-tools/          # MCP 工具
│   ├── services/           # 服务层
│   └── frontend/           # 前端代码
├── tests/                   # 测试
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── e2e/                # 端到端测试
├── scripts/                 # 脚本
│   ├── setup/              # 设置脚本
│   ├── deploy/             # 部署脚本
│   └── monitor/            # 监控脚本
├── data/                    # 数据文件
├── .hermes/skills/         # Hermes 技能
├── .gitignore
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.11
- Git

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd 电商多 agent

# 运行设置脚本
./scripts/setup/install.sh
```

## 开发

```bash
# 运行测试
npm test

# 启动开发服务器
npm run dev
```

## 许可证

MIT
