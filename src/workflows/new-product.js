#!/usr/bin/env node
/**
 * 新品上架工作流 — 交互式 CLI Demo
 *
 * 模拟完整的 7 步新品上架流程：
 * 信息采集 → 任务分解 → 并行处理 → 库存设置 → 质审 → 上架 → 汇报
 *
 * 用法：npm run new-product
 */

const readline = require('readline');

// ============================================================
// 工具函数
// ============================================================
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// 颜色输出
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
  red: '\x1b[31m', magenta: '\x1b[35m',
  bgGreen: '\x1b[42m', bgYellow: '\x1b[43m',
};
const log = {
  manager: msg => console.log(`${c.cyan}${c.bold}[👔 店长]${c.reset} ${msg}`),
  designer: msg => console.log(`${c.magenta}[🎨 美工]${c.reset} ${msg}`),
  copywriter: msg => console.log(`${c.blue}[✍️ 文案]${c.reset} ${msg}`),
  operator: msg => console.log(`${c.yellow}[📊 运营]${c.reset} ${msg}`),
  warehouse: msg => console.log(`${c.dim}[📦 仓储]${c.reset} ${msg}`),
  system: msg => console.log(`${c.dim}[系统]${c.reset} ${msg}`),
  step: (n, msg) => console.log(`\n${c.bold}━━━ Step ${n}：${msg} ━━━${c.reset}`),
  done: msg => console.log(`${c.green}✅ ${msg}${c.reset}`),
  warn: msg => console.log(`${c.yellow}⚠️  ${msg}${c.reset}`),
  progress: (pct, msg) => {
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  ${c.cyan}[${bar}]${c.reset} ${pct}% ${msg}`);
  },
};

// ============================================================
// 商品信息卡
// ============================================================
class ProductInfo {
  constructor() {
    this.name = '';
    this.category = '';
    this.material = '';
    this.sellingPoints = [];
    this.targetAudience = '';
    this.style = '';
    this.priceMin = 0;
    this.priceMax = 0;
    this.initialStock = 0;
    this.platforms = [];
  }

  isComplete() {
    return this.name && this.category && this.sellingPoints.length > 0 && this.priceMin > 0;
  }
}

// ============================================================
// 模拟 Agent 产出
// ============================================================

function simulateDesignerWork(product) {
  const styles = {
    '简约': 'minimalist white background, clean lines',
    '商务': 'professional office setting, premium feel',
    '可爱': 'soft pastel colors, kawaii style',
    '科技': 'futuristic, dark gradient background',
  };
  const styleDesc = styles[product.style] || styles['简约'];

  return {
    images: [
      { file: '01_主图_白底.jpg', desc: '正面展示，纯白背景，800×800', size: '1.2MB' },
      { file: '02_细节图_材质.jpg', desc: '304 不锈钢内胆特写，微距镜头', size: '0.9MB' },
      { file: '03_场景图_办公桌.jpg', desc: `${product.targetAudience}使用场景，${product.style}风格`, size: '1.5MB' },
      { file: '04_对比图.jpg', desc: '与普通保温杯保温效果对比', size: '0.8MB' },
      { file: '05_包装图_礼盒.jpg', desc: '品牌礼盒包装展示', size: '1.1MB' },
    ],
    totalCandidates: rand(15, 20),
    qualityScore: rand(8, 10),
    timeSeconds: rand(180, 300),
  };
}

function simulateCopywriterWork(product) {
  const sp = product.sellingPoints[0] || product.name;
  return {
    titles: [
      `【304不锈钢】${product.name} ${product.targetAudience}便携大容量防漏水杯`,
      `${product.name} ${sp} ${product.targetAudience}专用 12h长效保温`,
      `品质之选！${product.name} ${product.material ? '·' + product.material : ''} ${sp}`,
      `简约不简单 — ${product.name} 你的日常温度守护者`,
      `限时首发 | ${product.name} ${sp} 今日下单立减10元`,
    ],
    detailPage: {
      headline: `早上9点倒的热水，下午6点喝还是烫的`,
      painPoints: `${product.targetAudience}日常：开会到一半水凉了、外出找不到热水、杯子漏水弄湿文件`,
      sellingPoints: product.sellingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n'),
      specs: `容量：500ml | 材质：${product.material || '304不锈钢'} | 重量：280g | 尺寸：6.5×22cm`,
      scenes: `办公桌 / 通勤路上 / 健身房 / 户外露营 / 商务送礼`,
      guarantee: '30 天无忧退换 | 1 年质保 | 7×24 客服',
    },
    seoKeywords: [product.name, '保温杯', product.material, product.targetAudience, '便携', '大容量', '办公室'],
    qualityScore: rand(8, 10),
    timeSeconds: rand(120, 180),
  };
}

function simulateOperatorWork(product) {
  const price = Math.round((product.priceMin + product.priceMax) / 2);
  return {
    recommendedPrice: price,
    competitorAvgPrice: Math.round(price * 1.12),
    competitorRange: `¥${Math.round(price * 0.78)} - ¥${Math.round(price * 1.35)}`,
    profitMargin: rand(35, 50),
    roi: (Math.random() * 2 + 2).toFixed(1),
    launchStrategy: `新品首发价 ¥${price}（限时 7 天），第 2 周调至 ¥${Math.round(price * 1.08)}，配合满 200 减 20`,
    channelRecommendation: product.platforms.includes('淘宝') ? '淘宝直通车 + 淘客' : '抖音短视频 + 直播',
    timeSeconds: rand(240, 480),
  };
}

function simulateWarehouseWork(product) {
  return {
    sku: `SKU-${Date.now().toString(36).toUpperCase()}`,
    initialStock: product.initialStock || rand(200, 1000),
    safetyThreshold: Math.round((product.initialStock || 500) * 0.1),
    warehouseLocation: '杭州主仓 A-3-15',
    timeSeconds: rand(30, 60),
  };
}

// ============================================================
// 主流程
// ============================================================
async function main() {
  console.clear();
  console.log(`
${c.cyan}${c.bold}╔══════════════════════════════════════════════════════════════╗
║  🚀 新品上架自动化工流                                       ║
║  传统 2 天 → Agent 协作 ~25 分钟 → 效率提升 95%              ║
╚══════════════════════════════════════════════════════════════╝${c.reset}
`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(resolve => rl.question(`${c.bold}${q}${c.reset}`, resolve));

  const product = new ProductInfo();

  // ============================================================
  // STEP 1: 信息收集
  // ============================================================
  log.step(1, '信息收集（店长引导商家填写商品信息）');
  log.manager('您好！我来帮您完成新品上架。请告诉我以下信息：\n');

  product.name = await ask('📦 商品名称（如：304 不锈钢保温杯）：');
  if (!product.name) { console.log('已取消。'); rl.close(); return; }

  product.category = await ask('📂 商品类目（如：家居 > 杯具 > 保温杯）：') || '家居 > 杯具';
  product.material = await ask('🔧 主要材质/规格（如：304 不锈钢、双层真空）：') || '';
  const points = await ask('💡 核心卖点（用逗号分隔，如：12h保温,防漏,便携）：');
  product.sellingPoints = points ? points.split(',').map(s => s.trim()).filter(Boolean) : ['高品质'];

  product.targetAudience = await ask('👤 目标人群（如：商务白领 / 学生 / 户外）：') || '商务白领';
  product.style = await ask('🎨 风格偏好（简约 / 商务 / 可爱 / 科技）：') || '简约';

  const priceInput = await ask('💰 价格范围（如：79-99）：') || '79-99';
  const [pmin, pmax] = priceInput.split('-').map(Number);
  product.priceMin = pmin || 79;
  product.priceMax = pmax || 99;

  const stockInput = await ask('📦 初始库存数量（默认 500）：');
  product.initialStock = parseInt(stockInput) || 500;

  const platInput = await ask('🏪 上架平台（taobao / jd / douyin，默认淘宝）：') || 'taobao';
  product.platforms = platInput.split(',').map(s => s.trim()).filter(Boolean);

  console.log('');
  log.manager(`信息采集完毕。已为您生成商品信息卡：`);
  console.log(`
  ${c.bold}${product.name}${c.reset}
  ├─ 类目：${product.category}
  ├─ 材质：${product.material || '—'}
  ├─ 卖点：${product.sellingPoints.join(' / ')}
  ├─ 人群：${product.targetAudience}
  ├─ 风格：${product.style}
  ├─ 价格：¥${product.priceMin}-${product.priceMax}
  ├─ 库存：${product.initialStock} 件
  └─ 平台：${product.platforms.join(' / ')}
  `);

  await ask('\n按 Enter 开始任务分解...');

  // ============================================================
  // STEP 2: 任务分解
  // ============================================================
  log.step(2, '任务分解与分配（店长编排 Agent 协作）');
  const startTime = Date.now();

  log.manager('正在分析任务依赖关系...');
  await sleep(800);

  console.log(`
  ${c.cyan}📋 任务分解方案${c.reset}
  ┌─────────────────────────────────────────────┐
  │ Phase 1 [并行 ⚡]                             │
  │ ├─ 🎨 美工   → 生成 5 张商品图                │
  │ ├─ ✍️ 文案   → 标题 ×5 + 详情页 + SEO         │
  │ └─ 📊 运营   → 竞品分析 + 定价策略             │
  │                                              │
  │ Phase 2 [串行 →]                              │
  │ └─ 📦 仓储   → 设置 SKU + 库存 + 安全阈值      │
  │                                              │
  │ Phase 3 [串行 →]                              │
  │ └─ 👔 店长   → 质量审核 + 一键上架 + 汇报      │
  └─────────────────────────────────────────────┘
  `);

  log.manager(`已派出 3 个并行任务。预计总耗时：${c.bold}约 25 分钟${c.reset}`);
  await sleep(1000);

  // ============================================================
  // STEP 3: 并行处理
  // ============================================================
  log.step(3, '并行处理（美工 + 文案 + 运营同步工作）');
  console.log(`${c.dim}  启动并行执行引擎...${c.reset}\n`);

  // 并行模拟
  const tasks = [
    { name: '美工', icon: '🎨', logFn: log.designer, work: () => simulateDesignerWork(product) },
    { name: '文案', icon: '✍️', logFn: log.copywriter, work: () => simulateCopywriterWork(product) },
    { name: '运营', icon: '📊', logFn: log.operator, work: () => simulateOperatorWork(product) },
  ];

  const results = {};
  const progressLines = tasks.map(() => ({ pct: 0, msg: '初始化...' }));

  // 显示并行进度
  const progressInterval = setInterval(() => {
    process.stdout.write('\x1b[3A'); // 上移 3 行
    tasks.forEach((t, i) => {
      const p = progressLines[i];
      const bar = '█'.repeat(Math.floor(p.pct / 5)) + '░'.repeat(20 - Math.floor(p.pct / 5));
      const color = p.pct >= 100 ? c.green : c.yellow;
      console.log(`  ${t.icon} ${t.name.padEnd(4)} ${color}[${bar}]${c.reset} ${p.pct}% ${p.msg}`);
    });
  }, 200);

  // 并行执行
  const taskPromises = tasks.map(async (t, i) => {
    t.logFn(`收到任务：${t.name === '美工' ? `生成 ${product.style} 风格商品图 ×5` :
      t.name === '文案' ? `撰写 ${product.name} 标题和详情页` :
        `分析竞品定价 + 制定 ${product.name} 定价策略`}`);

    const totalTime = t.name === '美工' ? rand(4, 7) : t.name === '文案' ? rand(3, 5) : rand(6, 10);

    for (let sec = 0; sec <= totalTime; sec++) {
      const pct = Math.min(100, Math.round((sec / totalTime) * 100));
      const msgs = {
        '美工': ['分析商品特征...', '生成 Prompt...', '调用通义万相 API...', '筛选最优图片...', '精修处理...', '质量检查...'],
        '文案': ['提取卖点关键词...', '生成标题变体...', '撰写详情页...', 'SEO 优化...', '禁用词过滤...', '品牌语调校对...'],
        '运营': ['抓取竞品价格...', '分析历史数据...', '计算定价模型...', '制定促销策略...', 'ROI 预估...', '输出定价报告...'],
      };
      const msgIdx = Math.min(Math.floor(sec / totalTime * msgs[t.name].length), msgs[t.name].length - 1);
      progressLines[i] = { pct, msg: msgs[t.name][msgIdx] };
      await sleep(300 + Math.random() * 400);
    }

    progressLines[i] = { pct: 100, msg: c.green + '✅ 完成！' + c.reset };
    return t.work();
  });

  const workResults = await Promise.all(taskPromises);
  clearInterval(progressInterval);
  process.stdout.write('\n');

  results.designer = workResults[0];
  results.copywriter = workResults[1];
  results.operator = workResults[2];

  // 展示并行结果
  log.done(`🎨 美工：生成 ${results.designer.totalCandidates} 张候选 → 精选 5 张（质量评分 ${results.designer.qualityScore}/10）`);
  results.designer.images.forEach(img => console.log(`     ${c.dim}📷 ${img.file} — ${img.desc}${c.reset}`));

  log.done(`✍️ 文案：生成 5 个标题版本 + 详情页 1,200 字（质量评分 ${results.copywriter.qualityScore}/10）`);
  console.log(`     ${c.dim}最佳标题：${results.copywriter.titles[0]}${c.reset}`);

  log.done(`📊 运营：推荐定价 ¥${results.operator.recommendedPrice}（竞品均价 ¥${results.operator.competitorAvgPrice}，利润率 ${results.operator.profitMargin}%）`);

  await ask('\n按 Enter 继续库存设置...');

  // ============================================================
  // STEP 4: 库存设置
  // ============================================================
  log.step(4, '库存设置（仓储 Agent 创建 SKU）');
  log.warehouse('收到任务：设置 SKU 和初始库存...');
  await sleep(1000);

  const whResult = simulateWarehouseWork(product);
  results.warehouse = whResult;

  log.done(`SKU 已创建：${whResult.sku}`);
  console.log(`     初始库存：${whResult.initialStock} 件 | 安全阈值：${whResult.safetyThreshold} 件 | 仓位：${whResult.warehouseLocation}`);

  await ask('\n按 Enter 进入质量审核...');

  // ============================================================
  // STEP 5: 质量审核
  // ============================================================
  log.step(5, '质量审核（店长复核所有产出）');

  const checks = [
    { label: '商品图数量 ≥ 5 张', pass: results.designer.images.length >= 5 },
    { label: '商品图尺寸 800×800', pass: true },
    { label: '文案无禁用词', pass: true },
    { label: '文案字数合规', pass: true },
    { label: '定价有数据依据', pass: results.operator.competitorAvgPrice > 0 },
    { label: '利润率在合理范围（30-60%）', pass: results.operator.profitMargin >= 30 && results.operator.profitMargin <= 60 },
    { label: '库存设置正确', pass: whResult.initialStock > 0 },
  ];

  console.log('');
  for (const check of checks) {
    await sleep(400);
    if (check.pass) {
      console.log(`  ${c.green}✅${c.reset} ${check.label}`);
    } else {
      console.log(`  ${c.red}❌${c.reset} ${check.label} ${c.yellow}→ 需修正${c.reset}`);
    }
  }

  const allPassed = checks.every(c => c.pass);
  if (allPassed) {
    log.done('质量审核通过！所有产出物达标。');
  } else {
    log.warn('部分项未通过，已退回对应 Agent 修改。');
    await sleep(1000);
    log.done('修改完成，复审通过。');
  }

  await ask('\n按 Enter 执行上架...');

  // ============================================================
  // STEP 6: 上架
  // ============================================================
  log.step(6, `一键上架至 ${product.platforms.join(' / ')}（MCP 工具调用）`);

  for (const platform of product.platforms) {
    await sleep(600);
    process.stdout.write(`  ${c.yellow}⏳${c.reset} 正在推送至 ${platform}...`);
    await sleep(rand(800, 1500));
    const productId = `ID-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    process.stdout.write(`\r  ${c.green}✅${c.reset} ${platform} 上架成功！商品 ID：${productId}\n`);
  }

  // ============================================================
  // STEP 7: 汇报
  // ============================================================
  const totalSec = Math.round((Date.now() - startTime) / 1000);
  const totalMin = Math.floor(totalSec / 60);
  const totalSecRemain = totalSec % 60;

  log.step(7, '结果汇报');
  console.log(`
${c.bold}${c.green}╔══════════════════════════════════════════════════════════════╗
║  ✅ 新品上架完成！                                            ║
╚══════════════════════════════════════════════════════════════╝${c.reset}

${c.bold}📦 ${product.name}${c.reset} — 已成功上架
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${c.dim}├─${c.reset} 平台：${product.platforms.join(' / ')}
${c.dim}├─${c.reset} 商品图：5 张（${results.designer.qualityScore}/10 分）
${c.dim}├─${c.reset} 文案：标题 ×5 + 详情页 1,200 字（${results.copywriter.qualityScore}/10 分）
${c.dim}├─${c.reset} 定价：¥${results.operator.recommendedPrice}（利润率 ${results.operator.profitMargin}%，竞品均价 ¥${results.operator.competitorAvgPrice}）
${c.dim}├─${c.reset} 库存：${whResult.initialStock} 件（SKU: ${whResult.sku}）
${c.dim}└─${c.reset} 耗时：${totalMin} 分 ${totalSecRemain} 秒

${c.cyan}💡 建议${c.reset}
  • ${results.operator.launchStrategy}
  • 竞品价格区间：${results.operator.competitorRange}
  • 推荐渠道：${results.operator.channelRecommendation}

${c.green}${c.bold}🚀 传统方式需 2 天，Agent 协作 ${totalMin} 分钟完成，提效 95%！${c.reset}
`);

  // 效率对比
  console.log(`${c.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(`${c.bold}效率对比${c.reset}`);
  console.log(`  传统人工：约 16 工时（2 个工作日）`);
  console.log(`  Agent 协作：${totalMin} 分 ${totalSecRemain} 秒`);
  console.log(`  ${c.green}效率提升：95% ↑${c.reset}`);
  console.log(`  传统成本：美工 ¥500 + 文案 ¥300 + 运营 ¥400 = ${c.red}¥1,200${c.reset}`);
  console.log(`  Agent 成本：API 调用约 ${c.green}¥1.50${c.reset}`);
  console.log('');

  rl.close();
}

main().catch(err => {
  console.error('执行出错:', err.message);
  process.exit(1);
});
