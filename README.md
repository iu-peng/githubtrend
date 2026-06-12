# GitHub Trending 微信推送

每天自动抓取 [GitHub Trending](https://github.com/trending) 仓库，通过 [WxPusher](https://wxpusher.zjiecode.com/) 推送到你的微信。

**无需服务器**，使用 GitHub Actions 定时运行。

## 快速开始

### 1. 获取 WxPusher 配置

- 打开 [WxPusher 管理台](https://wxpusher.zjiecode.com/admin/)
- 微信扫码登录
- **获取 appToken**：左侧菜单「应用管理」→「新建应用」或使用默认应用，复制 **AppToken**
- **获取 UID**：左侧菜单「用户管理」→ 找到你自己的用户，复制 **UID**

### 2. Fork 本项目

点击右上角 Fork 到你的 GitHub 账号下。

### 3. 配置 GitHub Secrets

在 Fork 后的仓库中：

1. 进入 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**，添加以下两个 Secrets：

| Secret 名称 | 说明 |
|---|---|
| `WXPUSHER_APP_TOKEN` | WxPusher 应用的 AppToken |
| `WXPUSHER_UID` | 你的 WxPusher 用户 UID |

### 4. 手动触发测试

1. 进入仓库的 **Actions** 页面
2. 左侧选择 **GitHub Trending 每日推送**
3. 点击 **Run workflow** → **Run workflow**

如果一切正常，你的微信将会收到一条推送消息。

## 本地运行

```bash
# 克隆项目
git clone <你的仓库地址>
cd github-trending-wechat

# 安装依赖
npm install

# 设置环境变量
export WXPUSHER_APP_TOKEN="你的AppToken"
export WXPUSHER_UID="你的UID"

# 运行
npm start
```

也可以创建 `.env` 文件（已加入 `.gitignore`，不会被提交）：

```bash
WXPUSHER_APP_TOKEN=你的AppToken
WXPUSHER_UID=你的UID
```

然后使用：

```bash
export $(cat .env | xargs) && npm start
```

## 自定义配置

所有配置通过环境变量传入，支持在 GitHub Actions 的 **Variables** 或本地环境变量中设置。

| 环境变量 | 说明 | 默认值 |
|---|---|---|
| `TRENDING_RSS_URL` | GitHub Trending RSS 地址 | `https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml` |
| `TRENDING_LIMIT` | 推送仓库数量 | `10` |
| `WXPUSHER_APP_TOKEN` | WxPusher AppToken（必填） | — |
| `WXPUSHER_UID` | WxPusher 用户 UID（必填） | — |

### 修改推送数量

在 GitHub Actions Variables 中设置 `TRENDING_LIMIT`，或在本地运行时：

```bash
export TRENDING_LIMIT=5
npm start
```

### 修改 RSS 地址

RSS 基于 [mshibanami/GitHubTrendingRSS](https://github.com/mshibanami/GitHubTrendingRSS)，支持的地址格式：

| 地址 | 说明 |
|---|---|
| `daily/all.xml` | 每日全部语言 |
| `daily/javascript.xml` | 每日 JavaScript |
| `daily/python.xml` | 每日 Python |
| `daily/typescript.xml` | 每日 TypeScript |
| `weekly/all.xml` | 每周全部语言 |
| `monthly/all.xml` | 每月全部语言 |
| `daily/go.xml` | 每日 Go |
| `daily/rust.xml` | 每日 Rust |

完整路径：`https://mshibanami.github.io/GitHubTrendingRSS/<路径>`

例如只看 JavaScript 每日趋势：

```bash
export TRENDING_RSS_URL="https://mshibanami.github.io/GitHubTrendingRSS/daily/javascript.xml"
npm start
```

## 定时运行说明

GitHub Actions 的 cron 使用 **UTC 时间**：

- `0 0 * * *` → UTC 每天 0:00
- 对应 **北京时间约早上 8:00**
- 对应 **东京时间约早上 9:00**

GitHub Actions 免费版每月有 2000 分钟的运行额度，每天运行一次完全足够。

## 推送内容格式

推送消息使用 **Markdown** 格式，每条消息包含：

```
# GitHub Trending 今日推荐

## 1. owner/repo
项目简介
链接：https://github.com/owner/repo

## 2. owner/repo
...
```

## 项目结构

```
github-trending-wechat/
├── index.js              # 主逻辑
├── package.json          # 项目配置
├── .gitignore            # Git 忽略文件
├── README.md             # 说明文档
└── .github/
    └── workflows/
        └── daily.yml     # GitHub Actions 定时任务
```

## 技术栈

- **Node.js 20** + ESM 模块
- **rss-parser** 解析 RSS
- **Node 原生 fetch** 调用 WxPusher API
- **GitHub Actions** 定时调度

## License

MIT
