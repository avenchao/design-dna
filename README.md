# DESIGN DNA

AI时代，你是哪种设计幸存者？10道题、8种设计精神状态、主/隐藏大师、1080×1920分享卡。

前端：GitHub Pages。后端：Supabase Edge Function。数据：Supabase PostgreSQL。网站访问无需账号，测试使用独立测评密码。

## 本地开发

需要Node.js >=22.13。执行 npm ci，把 .env.example 复制为 .env.local，然后 npm run dev。

PAGES_BASE_PATH 是部署路径；VITE_SUPABASE_API_URL 是公开的后端地址。前端不需要任何数据库私钥。

验证：npm run typecheck、npm test、npm run build。后端修改后执行 npm run sync:model，再使用已登录的 Supabase CLI 发布函数。

## 发布

GitHub 仓库变量 VITE_SUPABASE_API_URL 保存公开 Edge Function URL。main 分支通过 GitHub Actions 构建并发布 GitHub Pages。分享链接使用 #/result/ID，刷新不会产生静态托管的404。

Supabase: 设置 ALLOWED_ORIGINS 和 IP_HASH_SALT；supabase db push 应用结构；supabase functions deploy design-dna --no-verify-jwt --use-api 发布。网关JWT关闭是因为本产品使用测评密码与随机会话令牌授权；所有表在私有schema，启用RLS，匿名用户不能直接访问，数据库RPC仅服务端角色可执行。

## 新增测评密码

运行 node scripts/generate-supabase-codes.mjs 20。它将明文密码和数据库导入SQL写入忽略的 outputs/。在本项目的Supabase SQL Editor执行SQL即可启用，不必重新发布前端。每个密码最多开测3次。不要把这两个文件放进仓库或网页。

## 数据和功能

主分=主映射次数+标志答案×0.25；并列依次比较标志命中、次映射、Q9/Q10/Q8/Q5、固定类型顺序。结果不展示原始答案或密码。浏览器预览直接显示导出的PNG，确保看到的内容与图片一致。手机支持系统文件分享，降级为长按或下载；实际系统菜单由设备决定。

历史数据通过私有迁移导入；reserved迁移只保留版本占位，不包含实际数据。仓库没有密码表、会话、原始答卷、数据库密码或服务端密钥。

## 免费版说明

本项目当前使用Supabase免费版，持续低活跃可能导致项目暂停，需要在控制台恢复。说明：https://supabase.com/docs/guides/platform/free-project-pausing 。没有开通付费订阅或自动保活任务。
