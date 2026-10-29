# DESIGN DNA 大陆正式部署

正式域名：https://dna.avenchao.top

以下是待连接服务器后执行的部署配置，不代表域名或服务器已上线。

## 架构

大陆服务器运行 Nginx，托管静态网页及全部100张JPEG/WebP题目图片。网页仅请求同域 `/api/`，由Nginx通过校验TLS的HTTPS连接转发至现有Supabase Edge Function。保留现有数据库、所有Token及使用次数，不迁移或重置答卷。Supabase仍是现有境外服务，必须从选定大陆服务器实测接口延迟与可达性，不能仅凭本地预览认定国内稳定。

## 先确认

- 服务器位于中国大陆，提供IP、操作系统和已有SSH登录方式。
- 访问云控制台确认安全组允许80、443；SSH端口仅开放给管理入口。
- 阿里云DNS为 `dna` 添加该服务器的A记录。没有实际IPv6服务时不要添加AAAA。
- 确认该域名已可用于所选服务商接入，不替换主域名或其他子域名记录。

## 构建

在项目根目录执行 `node scripts/build-mainland.mjs`，输出 `dist-mainland/`。不需要数据库私钥或Token清单。

大陆构建使用根路径、`/play/{token}`、`/result/{resultId}`、同域API和本地优先图片。现有查询参数链接继续兼容。首页、问卷、结果、后台等页面均显示可点击的备案号。分享PNG不添加备案页脚。

## 安装顺序（Ubuntu/Debian参考）

1. 检查已有Nginx站点、操作系统和80/443占用，备份后只新增本站配置。
2. 安装Nginx、Certbot和CA证书。建立 `/var/www/design-dna/releases/` 与 `/var/lib/letsencrypt/`。
3. 解压静态目录到独立版本目录，通过 `current` 软链接切换；保留上一版本。
4. 安装 `nginx-http.conf`，先运行 `nginx -t` 再reload。
5. DNS生效后执行 `certbot certonly --webroot -w /var/lib/letsencrypt -d dna.avenchao.top`，使用站长提供的邮箱并由站长接受服务条款。
6. 证书签发后安装 `nginx-https.conf`。确认系统CA路径正确，`nginx -t` 成功后reload。HTTP页面返回308，保留路径与查询参数；ACME校验目录用于证书签发和续期。
7. 检查Certbot定时续期，安装deploy hook执行 `nginx -t && systemctl reload nginx`，用 `certbot renew --dry-run` 验证。

## 后端与域名切换

1. 保留原Supabase `ALLOWED_ORIGINS`，增加 `https://dna.avenchao.top`，不要覆盖其他密钥。
2. 应用 `202610290010_configurable_access_urls.sql`。该准备迁移默认仍输出旧域名，不提前切换。
3. 上线后实测首页、图片、Token授权、续答、完整10题、独立结果和PNG；测试使用独立测试资格，不消耗待售库存。
4. 全部通过后执行 `activate-domain.sql`。后台和CSV开始输出 `https://dna.avenchao.top/play/{原token}`。
5. 既有GitHub Pages链接继续有效；不要重新生成已发货Token。需要更新小红书未发货库存时，仅替换完整URL并按实时状态排除已用或已发出的资格，避免重复导入。

## 上线验证

从大陆服务器和至少一个国内终端执行 `node deploy/mainland/check-live.mjs`，记录执行位置及结果。此脚本检查HTTPS证书、HTTP跳转、主要页面、50张JPEG和50张WebP、同域API错误响应。它不创建测试Session，也不扣次。完整答题及真实手机体验仍需单独检查。

备案文案：陇ICP备2026010657号。链接：https://beian.miit.gov.cn/。

正式发布前检查Nginx配置和证书，部署过程中不改题库、计分、结果类别或3次配额。

## 回滚

静态页面切回上一个release，并执行 `rollback-domain.sql` 恢复CSV展示域名。不要恢复旧数据库备份，否则可能回退真实使用次数。保留新旧域名的后端来源许可直至回滚结束。
