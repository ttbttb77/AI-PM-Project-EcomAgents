# CLAUDE.md

Read `AGENTS.md` first. It is the canonical agent guide for this project.

## Project In One Sentence

电商多 Agent 协同运营系统是一个面向中小电商商家的 **AI 产品原型 + 架构验证 Demo**。

## Must Preserve

- Agent outputs are simulated with `setTimeout + template text`.
- Sales and operation data are mock/seed data.
- Do not describe mock metrics as real business results.
- For resume or interview content, emphasize product design, Agent orchestration, Demo validation, and evaluation framework.
- Do not over-emphasize backend engineering for AI product-manager positioning.

## Useful Commands

Use `npm.cmd` in Windows PowerShell when `npm` is blocked by execution policy.

```bash
npm.cmd run init-db
npm.cmd start
npm.cmd test
```

Main local URL:

```text
http://localhost:3000/pages/dashboard.html
```

## Key Files

- `AGENTS.md`: full agent guide
- `README.md`: human-facing GitHub overview
- `src/backend/services/orchestrator.js`: workflow orchestration
- `config/workflows.yaml`: workflow configuration
- `src/frontend/pages/`: demo pages
- `tests/orchestrator.test.js`: smoke tests
