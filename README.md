# 技术热榜微信推送

每天自动抓取多个技术平台的热门内容，通过 [Server酱](https://sct.ftqq.com/) 推送到你的微信。

**无需服务器、完全免费**，使用 GitHub Actions 定时运行。

## 覆盖平台

| 平台 | 说明 | 数据源 |
|---|---|---|
| GitHub Trending | 每日热门开源仓库 | 官方 RSS |
| V2EX | 技术社区热帖 | 官方 RSS |
| Hacker News | 国外技术热帖 | hnrss.org |
| Reddit Programming | Reddit 编程板块热帖 | 官方 RSS |
| 掘金热榜 | 掘金每周热门文章 | RSSHub |
| 知乎热榜 | 知乎实时热榜 | RSSHub |
| Product Hunt | 每日新产品 | RSSHub |

每个平台抓取 10 条（可通过环境变量调整）。

## 快速开始

### 1. 获取 Server酱 SendKey

- 打开 [sct.ftqq.com](https://sct.ftqq.com/)
- 微信扫码登录
- 首页复制 **SendKey**

### 2. 推送到 GitHub

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

### 3. 配置 GitHub Secrets

仓库 → Settings → Secrets and variables → Actions → New repository secret：

| Secret 名称 | 说明 |
|---|---|
| `SCT_SENDKEY` | Server酱 的 SendKey |

### 4. 测试

Actions → 技术热榜每日推送 → Run workflow

## 本地运行

```bash
npm install
SCT_SENDKEY="你的SendKey" npm start
```

## 自定义配置

| 环境变量 | 说明 | 默认值 |
|---|---|---|
| `TRENDING_LIMIT` | 每个平台抓取数量 | `10` |
| `GITHUB_RSS_URL` | GitHub Trending RSS 地址 | daily/all.xml |
| `SCT_SENDKEY` | Server酱 SendKey（必填） | — |

### 只推送 GitHub

在 GitHub Actions Variables 中设置，或本地运行时：

```bash
export GITHUB_RSS_URL="https://mshibanami.github.io/GitHubTrendingRSS/daily/javascript.xml"
npm start
```

## 定时运行

- cron `0 0 * * *` → UTC 0:00 → 北京时间约 8:00
- Server酱 免费版每天 5 条消息，本项目只发 1 条汇总消息，完全够用

## 推送格式

```
# 今日技术热榜汇总

## GitHub Trending
1. [owner/repo](https://github.com/...) - 项目简介
2. ...

## V2EX 热帖
1. [帖子标题](https://v2ex.com/...) 
2. ...

## Hacker News
...

> 更新时间：2026/6/12 08:00:00（北京时间）
```

## 项目结构

```
├── index.js              # 主逻辑
├── package.json
├── .gitignore
├── README.md
└── .github/workflows/daily.yml
```

## License

MIT
