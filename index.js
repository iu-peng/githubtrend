import Parser from "rss-parser";

// ==================== 配置 ====================

/** 每个平台抓取数量 */
const LIMIT = parseInt(process.env.TRENDING_LIMIT || "10", 10);

/** Server酱 API 地址 */
const SCT_API = `https://sctapi.ftqq.com/${process.env.SCT_SENDKEY}.send`;

/**
 * 各平台 RSS 源配置
 */
const PLATFORMS = [
  {
    name: "GitHub Trending",
    url: process.env.GITHUB_RSS_URL ||
      "https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml",
  },
  {
    name: "V2EX 热帖",
    url: "https://www.v2ex.com/feed/tab/hot.xml",
  },
  {
    name: "Hacker News",
    url: "https://hnrss.org/frontpage?count=20",
  },
  {
    name: "Reddit Programming",
    url: "https://www.reddit.com/r/programming/hot.rss?limit=20",
  },
  {
    name: "掘金前端",
    url: "https://rsshub.rssforever.com/juejin/category/frontend",
  },
  {
    name: "知乎热榜",
    url: "https://rsshub.rssforever.com/zhihu/hotlist",
  },
  {
    name: "Product Hunt",
    url: "https://rsshub.rssforever.com/producthunt/today",
  },
];

// ==================== 工具函数 ====================

/**
 * 校验必需的环境变量
 */
function assertEnv() {
  if (!process.env.SCT_SENDKEY) {
    throw new Error("缺少必需的环境变量：SCT_SENDKEY。");
  }
}

/**
 * 用原生 fetch 获取 RSS XML，再用 rss-parser 解析
 * 比 parser.parseURL 更可控超时
 */
async function fetchRSS(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 抓取单个平台的 RSS
 */
async function fetchPlatform(platform) {
  console.log(`📡 正在抓取 ${platform.name}...`);

  try {
    const xml = await fetchRSS(platform.url);
    const parser = new Parser();
    const feed = await parser.parseString(xml);

    if (!feed || !feed.items || feed.items.length === 0) {
      console.log(`⚠️  ${platform.name}：无数据，跳过`);
      return { name: platform.name, items: [] };
    }
    console.log(`✅ ${platform.name}：获取 ${feed.items.length} 条`);
    return { name: platform.name, items: feed.items.slice(0, LIMIT) };
  } catch (err) {
    console.log(`❌ ${platform.name}：抓取失败（${err.message}），跳过`);
    return { name: platform.name, items: [] };
  }
}

/**
 * 清理标题中的 HTML 标签并截断
 */
function cleanTitle(text, maxLen = 100) {
  let s = (text || "").replace(/<[^>]*>/g, "").trim();
  if (s.length > maxLen) s = s.slice(0, maxLen) + "…";
  return s;
}

/**
 * 从 GitHub RSS item 提取仓库名
 */
function extractRepoName(item) {
  if (item.link) {
    const match = item.link.match(/github\.com\/([^/]+\/[^/]+)/);
    if (match) return match[1];
  }
  return item.guid || item.title || "unknown";
}

/**
 * 组装所有平台的 Markdown 消息
 */
function buildMessage(results) {
  const lines = ["# 今日技术热榜汇总", ""];

  for (const { name, items } of results) {
    if (items.length === 0) continue;

    lines.push(`## ${name}`, "");

    items.forEach((item, i) => {
      const link = item.link || "";
      let displayTitle;

      if (name === "GitHub Trending") {
        const repo = extractRepoName(item);
        displayTitle = cleanTitle(item.title || repo);
        lines.push(`${i + 1}. [${repo}](${link}) - ${displayTitle}`);
      } else {
        displayTitle = cleanTitle(item.title);
        lines.push(`${i + 1}. [${displayTitle}](${link})`);
      }
    });

    lines.push("");
  }

  lines.push(
    `> 更新时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}（北京时间）`,
    "",
    "> Powered by GitHub Actions + Server酱",
  );

  return lines.join("\n");
}

/**
 * 通过 Server酱 推送
 */
async function pushToSCT(content) {
  const body = {
    title: "今日技术热榜",
    desp: content,
  };

  console.log("📤 正在推送到 Server酱...");
  const response = await fetch(SCT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (result.code !== 0) {
    throw new Error(
      `Server酱 推送失败：code=${result.code}，msg=${result.message || result.info || "未知错误"}，完整响应：${JSON.stringify(result)}`
    );
  }

  console.log("✅ 推送成功！");
}

// ==================== 主流程 ====================

async function main() {
  try {
    console.log("🚀 技术热榜汇总推送开始\n");

    assertEnv();

    // 并行抓取所有平台
    const results = await Promise.all(PLATFORMS.map(fetchPlatform));

    const totalItems = results.reduce((sum, r) => sum + r.items.length, 0);
    if (totalItems === 0) {
      throw new Error("所有平台均抓取失败，请检查网络或 RSS 源是否可用。");
    }
    console.log(`\n📊 共抓取 ${totalItems} 条内容\n`);

    const message = buildMessage(results);
    console.log("📝 推送内容预览：\n");
    console.log(message);
    console.log("");

    await pushToSCT(message);

    console.log("\n🎉 任务完成！");
  } catch (error) {
    console.error(`\n❌ 运行失败：${error.message}`);
    process.exit(1);
  }
}

main();
