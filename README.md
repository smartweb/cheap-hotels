# 特价品牌酒店 · 北上广深

基于[龙虾出行开放平台](https://docs.longxiachuxing.com)接口实现的**特价品牌酒店移动端 H5 应用**。
专注北上广深（默认深圳）三大性价比品牌：**全季 · 亚朵 · 桔子水晶**，默认 300 元以内、自动放宽到 400 元，今天就能住。

设计风格参考 [Vercel Geist](https://vercel.com/design.md) —— 高对比、克制配色、大量留白。

---

## ✨ 核心特性

| 能力 | 说明 |
|---|---|
| 🏙️ 城市切换 | 北上广深，默认**深圳**，底部/顶部一键切换 |
| 📅 日期快捷切换 | 默认**今天**，支持今天 / 明天 / 后天 / 周末一键切换，也可自选 |
| 🌿 品牌筛选 | 仅 **全季 / 亚朵 / 桔子水晶**，默认**全季** |
| 💸 价格档位 | 默认 **¥300 以内**；300 元内无房时**自动放宽到 ¥400**，并提示用户 |
| 🛏️ 房型/产品 | 搜索 → 房型 → 产品（含早餐/退改政策/可下单 offer_id） |
| 💳 下单 + 支付 | 填写联系人/入住人 → 创建订单 → **跳转龙虾出行收银台**完成支付 |
| 📋 我的订单 | 本地记录订单，待支付订单可重新拉起收银台 |

---

## 🔌 用到的龙虾出行接口

全部走服务端代理（**Bearer Token 永不进入前端**），符合[安全接入规范](https://docs.longxiachuxing.com/8986295m0.md)。

| 接口 | 用途 |
|---|---|
| `POST /open/v1/hotel/search` | 酒店搜索（品牌 + 价格档位） |
| `POST /open/v1/hotel/rooms` | 房型/产品详情（`search_offer_id` → 产品级 `offer_id`） |
| `POST /open/v1/hotel/order/create` | 创建订单（返回 `checkout_url` 收银台地址） |
| `POST /open/v1/hotel/order/pay` | 二次拉起收银台（备用） |

鉴权：`Authorization: Bearer rdak_live_xxx`，仅在 `src/lib/lx/client.ts` 注入，来源为服务端环境变量。

---

## 🚀 本地开发

```bash
# 1. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你在龙虾开放平台后台获取的 token
#   LX_API_TOKEN=rdak_live_xxxxxxxxxxxxxxxx

# 2. 安装依赖
npm install

# 3. 启动
npm run dev
# 打开 http://localhost:3000
```

> ⚠️ 龙虾出行开放平台要求**来源 IP 白名单**。本地联调如出现 401/403，请在平台后台把你的出口 IP 加入白名单。可用 `curl http://localhost:3000/api/health` 快速检查 token 是否配置成功。

### 可用脚本

```bash
npm run dev     # 开发
npm run build   # 生产构建
npm run start   # 运行生产构建
npm run lint    # ESLint
```

---

## ▲ 部署到 Vercel

1. 在 Vercel 导入本仓库（目录 `budget-hotels`）。
2. 在 **Project → Settings → Environment Variables** 添加：
   - `LX_API_TOKEN` = `rdak_live_xxxxxxxxxxxxxxxx`
   - （可选）`LX_API_BASE` = `https://api.longxiachuxing.com`
3. **务必把 Vercel 的出口 IP 加入龙虾平台 IP 白名单**（生产环境）。
4. Deploy。框架会自动识别为 Next.js。

`vercel.json` 已配置 `framework: nextjs`、香港区域。

---

## 🗂️ 项目结构

```
budget-hotels/
├── src/
│   ├── app/
│   │   ├── api/                  # 服务端 BFF 代理（注入 Bearer Token）
│   │   │   ├── health/route.ts   # 健康检查（确认 token 已配置）
│   │   │   ├── hotels/route.ts   # 搜索 + 品牌过滤 + 价格档位升级(300→400)
│   │   │   ├── rooms/route.ts    # 房型/产品详情
│   │   │   ├── orders/route.ts   # 创建订单（返回收银台 URL）
│   │   │   └── pay/route.ts      # 二次拉起支付
│   │   ├── hotel/[id]/           # 酒店/房型选择页
│   │   ├── checkout/             # 填写订单 → 下单 → 跳收银台
│   │   ├── orders/               # 我的订单
│   │   ├── page.tsx              # 首页（城市/日期/品牌筛选 + 列表）
│   │   └── layout.tsx            # 根布局（Geist 字体）
│   ├── components/               # UI 组件（Geist 风格）
│   └── lib/
│       ├── lx/                   # 龙虾出行服务端封装（client/hotel/types）
│       ├── catalog.ts            # 城市/品牌/价格档位/日期工具
│       ├── orders.ts             # 本地订单存储（localStorage）
│       └── browserFetch.ts       # 前端统一请求封装
├── tailwind.config.ts            # Geist 设计令牌
└── vercel.json
```

---

## 🎨 设计说明（Geist）

- **配色**：近中性画布 `#ffffff` / `#fafafa`，主文本 `#171717`，链接/聚焦 `#006bff`，灰阶承载层级。
- **字体**：Geist Sans（正文）+ Geist Mono（价格/单号等表格数字）。
- **形状**：6/12/16px 圆角；克制阴影（`0 2px 2px rgba(0,0,0,.04)`）。
- **交互**：状态即时，按压微缩放 `scale(0.97)`；尊重 `prefers-reduced-motion`。
- **聚焦**：双层环 `0 0 0 2px #fff, 0 0 0 4px #006bff`，所有可交互元素可见。

---

## ⚠️ 注意

- `rdak_live_*` 是生产 token，**下单会产生真实订单与扣费**；联调可用测试 token。
- 本应用仅在服务端持有 token，前端代码不含任何密钥。
- 价格/库存实时变动，最终以收银台与平台确认号为准。
