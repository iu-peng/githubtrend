import Parser from "rss-parser";

// ==================== 配置 ====================

/** GitHub Trending RSS 地址，可通过环境变量 TRENDING_RSS_URL 覆盖 */
const RSS_URL =
  process.env.TRENDING_RSS_URL ||
  "https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml";

/** 推送仓库数量，可通过环境变量 TRENDING_LIMIT 覆盖，默认 10 */
const LIMIT = parseInt(process.env.TRENDING_LIMIT || "10", 10);

/** Server酱 消息发送 API */
const SCT_API = `https://sctapi.ftqq.com/${process.env.SCT_SENDKEY}.send`;

// ==================== 工具函数 ====================

/**
 * 校验必需的环境变量是否存在
 * 缺少时直接抛出错误，避免静默失败
 */
function assertEnv() {
  if (!process.env.SCT_SENDKEY) {
    throw new Error("缺少必需的环境变量：SCT_SENDKEY。请在环境变量或 .env 文件中配置。");
  }
}

/**
 * 抓取 GitHub Trending RSS
 * @returns {Promise<Array>} 解析后的 RSS 条目列表
 */
async function fetchTrending() {
  const parser = new Parser();

  console.log(`📡 正在抓取 RSS：${RSS_URL}`);
  const feed = await parser.parseURL(RSS_URL);

  if (!feed || !feed.items || feed.items.length === 0) {
    throw new Error("RSS 抓取失败：未获取到任何仓库数据，请检查 RSS 地址是否可用。");
  }

  console.log(`✅ 成功抓取 ${feed.items.length} 个仓库，将推送前 ${LIMIT} 个`);
  return feed.items;
}

/**
 * 从 RSS 条目中提取仓库名（owner/repo 格式）
 * @param {object} item RSS 条目
 * @returns {string} owner/repo
 */
function extractRepoName(item) {
  // RSS 的 link 通常是 https://github.com/owner/repo
  if (item.link) {
    const match = item.link.match(/github\.com\/([^/]+\/[^/]+)/);
    if (match) return match[1];
  }
  // 兜底：用 guid 或 title
  return item.guid || item.title || "unknown";
}

/**
 * 将 RSS 条目列表组装成 Markdown 推送内容
 * @param {Array} items RSS 条目列表
 * @returns {string} Markdown 格式的推送内容
 */
function buildMessage(items) {
  const topItems = items.slice(0, LIMIT);

  const lines = ["# GitHub Trending 今日推荐", ""];

  topItems.forEach((item, index) => {
    const repoName = extractRepoName(item);
    const title = item.title || repoName;
    const link = item.link || "";

    // Markdown 链接格式：[显示文字](URL)
    lines.push(`${index + 1}. [${repoName}](${link}) - ${title}`);
    lines.push("");
  });

  lines.push(`> 更新时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}（北京时间）`);

  return lines.join("\n");
}

/**
 * 通过 Server酱 推送消息到微信
 * @param {string} content Markdown 内容
 */
async function pushToSCT(content) {
  const body = {
    title: "GitHub Trending 今日推荐",
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
    console.log("🚀 GitHub Trending 微信推送开始\n");

    // 1. 校验环境变量
    assertEnv();

    // 2. 抓取 RSS
    const items = await fetchTrending();

    // 3. 组装消息
    const message = buildMessage(items);
    console.log("\n📝 推送内容预览：\n");
    console.log(message);
    console.log("");

    // 4. 推送到 Server酱
    await pushToSCT(message);

    console.log("\n🎉 任务完成！");
  } catch (error) {
    console.error(`\n❌ 运行失败：${error.message}`);
    process.exit(1);
  }
}

main();
