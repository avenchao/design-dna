# DESIGN DNA 大陆正式部署

正式域名：https://dna.avenchao.top

2026-10-29 已部署至原阿里云轻量应用服务器 `8.130.103.90`，地域华北6（乌兰察布），宝塔站点 ID 为1。系统、现有数据及数据库均保留。

## 架构

大陆服务器运行 Nginx，托管静态网页及全部100张JPEG/WebP题目图片。网页仅请求同域 `/api/`，由Nginx通过校验TLS的HTTPS连接转发至现有Supabase Edge Function。保留现有数据库、所有Token及使用次数，不迁移或重置答卷。Supabase仍是现有境外服务，必须从选定大陆服务器实测接口延迟与可达性，不能仅凭本地预览认定国内稳定。

## 运行环境

- Alibaba Cloud Linux 3、宝塔阿里云专享版11.1、宝塔 Nginx 1.28.3；前端在本机构建，不要求服务器运行Node应用。
- 阿里云DNS的 `dna` A记录指向该服务器；80、443入方向公网规则启用。服务器现有规则保留。
- 网站根目录为 `/www/wwwroot/dna.avenchao.top/current`，指向该域名目录内的版本化release。
- 站点配置位于 `/www/server/panel/vhost/nginx/dna.avenchao.top.conf`，使用HTTP/2、同域API反代及动态上游DNS。
- 证书位于 `/www/server/panel/vhost/cert/dna.avenchao.top/`，私钥仅root可读，不包含在仓库或部署包。

## 构建

在项目根目录执行 `node scripts/build-mainland.mjs`，输出 `dist-mainland/`。不需要数据库私钥或Token清单。

大陆构建使用根路径、`/play/{token}`、`/result/{resultId}`、同域API和本地优先图片。现有查询参数链接继续兼容。首页、问卷、结果、后台等页面均显示可点击的备案号。分享PNG不添加备案页脚。

## 更新与证书维护

1. 更新前备份当前配置、release指针及Supabase应用数据；不要恢复旧数据来回滚网页，以免回退真实使用次数。
2. 通过宝塔已有Nginx提供服务，不另装第二套Web服务。上传新构建到独立release，验证后再切换 `current`。
3. 配置采用本目录 `nginx-https.conf`，其中CA路径适用于Alibaba Cloud Linux 3。修改后先运行 `/www/server/nginx/sbin/nginx -t`，通过后再graceful reload。
4. HTTP页面308跳转HTTPS，保留路径和查询参数；ACME校验目录继续用于签发与续期。
5. 证书由acme.sh 3.1.6签发，当前证书到期日2027-01-27。使用独立目录 `/root/.acme.sh-design-dna` 管理，账户密钥不进入站点目录。
6. `/etc/cron.d/design-dna-cert-renew` 每日03:17检查续期，脚本为 `/usr/local/sbin/design-dna-cert-renew`。续期后自动检查Nginx配置并reload；已执行一次任务验证新证书无需重复签发。任务日志位于 `/var/log/design-dna-cert-renew.log`。
7. 客户端关闭可选ARI查询以避开该链路的超时，继续按本地续期时间检查。首次计划续期时间为2026-11-27，早于到期时间。

## 后端与域名切换

正式域名已通过真实HTTPS测评、同域API、分享与配额验收，并已完成发货域名激活。后台及CSV统一输出正式域名，现有Token和真实使用次数未重置。以下步骤保留供后续维护使用。

1. 原Supabase `ALLOWED_ORIGINS` 已保留并增加 `https://dna.avenchao.top`；其他密钥保持原值。
2. `202610290010_configurable_access_urls.sql` 仅增加URL展示模式，不修改原Token或使用次数。
3. 上线后实测首页、图片、Token授权、续答、完整10题、独立结果和PNG；测试使用独立测试资格，不消耗待售库存。
4. 全部通过后执行 `activate-domain.sql`。后台和CSV开始输出 `https://dna.avenchao.top/play/{原token}`。
5. 既有GitHub Pages链接继续有效，未完成Session可继续从旧入口恢复，不强制跨域跳转。不要重新生成已发货Token。旧Excel/CSV文件不会自动变化，需在后台按实时状态重新导出，更新小红书库存时替换已有内容，避免重复导入。

## 备份与数据保护

部署前已保存Git完整bundle、宝塔配置归档及SQLite一致性快照。Supabase应用的7张私有表、函数、字段、约束、索引、RLS信息通过只读可重复读事务备份，并回读核对。

服务器副本在 `/www/backup/design-dna-predeploy-20261029/`；本机副本在用户 `.ssh/design-dna-backups/20261029/`，仅当前用户可读写。该目录及其数据不进入GitHub，不位于Web根目录。未重装系统、未清空任何生产表。验收使用独立测试资格，测试结束后仅停用该资格，保留测试记录。

## 上线验证

从大陆服务器和至少一个国内终端执行 `node deploy/mainland/check-live.mjs`，记录执行位置及结果。此脚本检查HTTPS证书、HTTP跳转、主要页面、50张JPEG和50张WebP、同域API错误响应。它不创建测试Session，也不扣次。完整答题及真实手机体验仍需单独检查。

备案文案：陇ICP备2026010657号。链接：https://beian.miit.gov.cn/。

正式发布前检查Nginx配置和证书，部署过程中不改题库、计分、结果类别或3次配额。

## 回滚

静态页面切回上一个release，并执行 `rollback-domain.sql` 恢复CSV展示域名。不要恢复旧数据库备份，否则可能回退真实使用次数。保留新旧域名的后端来源许可直至回滚结束。
