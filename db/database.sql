PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE tool_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO tool_categories VALUES('development','开发工具','代码开发和调试工具','Code','#10b981','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('testing','测试工具','自动化测试和质量保证工具','TestTube','#c084fc','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('deployment','部署工具','CI/CD和部署管理工具','Rocket','#f59f45','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('monitoring','监控工具','系统监控和日志分析工具','BarChart','#ef4444','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('database','数据库工具','数据库管理和操作工具','Database','#f59f45','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('communication','协作工具','团队协作和沟通工具','MessageSquare','#06b6d4','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('482a552d-b451-4f0a-a1d0-4d832a59958e','业务项目','','Monitor','#22bfa5','2025-09-22 06:00:29','2025-09-22 06:00:29');
CREATE TABLE tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'deprecated')),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category) REFERENCES tool_categories (id)
);
INSERT INTO tools VALUES('0277fcf4-e502-431d-a29e-8028cc6ddebf','Superset','查数 BI','database','https://images.seeklogo.com/logo-png/50/2/superset-icon-logo-png_seeklogo-500354.png',0,'active','2025-09-19','2025-09-16 02:06:01','2025-09-16 02:06:01');
INSERT INTO tools VALUES('a21d8fad-551e-48e9-b7e6-538e8de83231','Elastic','服务日志查询','monitoring','https://kibana.qiliangjia.org/ui/favicons/favicon.svg',0,'active','2025-09-16','2025-09-16 02:08:02','2025-09-16 02:08:02');
INSERT INTO tools VALUES('7cdfa366-a184-40af-8261-e5ffc449d225','Apollo 配置中心','配置中心','development','https://apollo-portal-test.qiliangjia.org/img/config.png',0,'active','2025-09-16','2025-09-16 02:10:35','2025-09-16 02:10:35');
INSERT INTO tools VALUES('dc948435-e177-475d-af3d-292534c33947','Jenkins','服务部署 CI / CD','deployment','https://cicd.qiliangjia.org/static/38454d67/images/svgs/logo.svg',0,'active','2025-09-16','2025-09-16 02:12:29','2025-09-16 02:12:29');
INSERT INTO tools VALUES('4d321857-c3f1-4996-9d32-e20eec9701ee','DeepClick','业务工程','482a552d-b451-4f0a-a1d0-4d832a59958e','https://deepclick.com/favicon.ico',0,'active','2025-09-22','2025-09-16 02:15:02','2025-09-16 02:15:02');
INSERT INTO tools VALUES('e45e32df-edb7-4fd3-b83e-1afd4deddee9','Cloudflare','云服务平台','development','https://dash.cloudflare.com/favicon.ico',0,'active','2025-09-16','2025-09-16 03:17:44','2025-09-16 03:17:44');
INSERT INTO tools VALUES('1b38545d-6060-4486-9654-e94f8063ab61','Growthbook','Feature flags','development','https://growthbook.qiliangjia.org/favicon.ico',0,'active','2025-09-16','2025-09-16 05:57:22','2025-09-16 05:57:22');
INSERT INTO tools VALUES('46c44ebc-880a-480c-acad-0b867ed23c87','多语言管理平台','管理多语言词条','communication','https://qlj-fe-i18n.qiliangjia.org/favicon.ico',0,'active','2025-09-16','2025-09-16 06:01:21','2025-09-16 06:01:21');
INSERT INTO tools VALUES('3f058b10-6c40-48fa-9693-4307b532a5f1','要事 AI','管理要事 AI 任务','communication','https://yaoshi-tracking-web.qiliangjia.one/favicon.ico',0,'active','2025-09-16','2025-09-16 06:04:34','2025-09-16 06:04:34');
INSERT INTO tools VALUES('bd04e5f9-2c37-4331-a873-0e6252d2e750','ROIBest - 接入文档','ROIBest-自研客户接入文档','482a552d-b451-4f0a-a1d0-4d832a59958e','https://www.roibest.com/favicon.ico',0,'active','2025-09-22','2025-09-18 07:25:49','2025-09-18 07:25:49');
INSERT INTO tools VALUES('6c15bb01-5b64-40d9-ab42-08ff3df37c4c','JSON 格式化','JSON 格式化','development','https://static.thenounproject.com/png/3962370-200.png',1,'active','2025-09-22','2025-09-19 12:11:54','2025-09-19 12:11:54');
INSERT INTO tools VALUES('57cfcfe0-8e3e-4b60-94e7-c02c3ceff999','URL 分析器','解析url字符串以获取所有不同的部分（协议、来源、参数、端口）','development','https://static.thenounproject.com/png/8061891-200.png',1,'active','2025-09-22','2025-09-22 07:11:07','2025-09-22 07:11:07');
INSERT INTO tools VALUES('4d7b4ba7-da42-4df2-b56e-8f5e42eaddd4','万事墙','项目排期追踪','communication','https://project.qiliangjia.org/logo.svg',0,'active','2025-09-22','2025-09-22 07:54:11','2025-09-22 07:54:11');
INSERT INTO tools VALUES('786df662-79b5-446a-bde5-4bd282788a6c','Roibest - Admin','RB 发版平台','482a552d-b451-4f0a-a1d0-4d832a59958e','https://mis-test-1.qiliangjia.one/favicon.ico',0,'active','2025-09-22','2025-09-22 07:56:48','2025-09-22 07:56:48');
INSERT INTO tools VALUES('b31e0059-d962-495e-8810-8a5399437bd1','Sentry','前端错误监控系统','monitoring','data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5MCIgaGVpZ2h0PSI5MCI+PHN0eWxlPkBrZXlmcmFtZXMgbG9nby12aXNpYmxlezQwJXtvcGFjaXR5OjB9NDUlLDY3JXtvcGFjaXR5OjA7ZmlsdGVyOmJsdXIoMCl9NDYle29wYWNpdHk6MTtmaWx0ZXI6Ymx1ciguNHB4KX02NSV7b3BhY2l0eToxO2ZpbHRlcjpibHVyKC43cHgpfX1Aa2V5ZnJhbWVzIGxvZ28tc3Bpbns0NSV7dHJhbnNmb3JtOnNjYWxlKDEpIHJvdGF0ZSgwZGVnKX00NiV7dHJhbnNmb3JtOnNjYWxlKC45NSkgcm90YXRlKDBkZWcpfTY2JSx0b3t0cmFuc2Zvcm06c2NhbGUoMSkgcm90YXRlKDM2MGRlZyl9fUBrZXlmcmFtZXMgbG9nby1kcmF3ezAlLHRve3N0cm9rZS1kYXNob2Zmc2V0OjMwMH0zMyUsNjQle3N0cm9rZS1kYXNob2Zmc2V0OjB9fTwvc3R5bGU+PGRlZnM+PHBhdGggaWQ9ImxvYWRpbmctbG9nbyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSI1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Im04IDUwLTQuMyA3LjZjLTEuNyAzLjMuNSA2IDMuNCA2aDE4LjhjMC0xMC44LTYuOS0xOC45LTEyLjgtMjIuMSAxLjktMy4yIDUtOSA2LjMtMTEgMTIgNyAxOS4xIDE5LjggMTkuMSAzMy4yaDEyLjZjMC0xNi44LTguNi0zNC4zLTI1LjUtNDQgNC4zLTcuNCA3LTEyLjQgOC42LTE0LjggMS41LTIuMyA1LjItMi40IDYuNiAwbDMwLjUgNTIuN2MxLjQgMi42IDAgNi0zLjggNmgtNi44Ii8+PC9kZWZzPjx1c2UgeD0iNSIgeT0iNSIgaHJlZj0iI2xvYWRpbmctbG9nbyIgc3R5bGU9ImFuaW1hdGlvbjpsb2dvLWRyYXcgNHMgY3ViaWMtYmV6aWVyKC45OSwwLC41MywxKSBpbmZpbml0ZSxsb2dvLXNwaW4gNHMgY3ViaWMtYmV6aWVyKC43NywtLjYzLC4xMiwxLjQ1KSBpbmZpbml0ZTtzdHJva2U6IzAwMDtzdHJva2UtZGFzaG9mZnNldDozMDA7dHJhbnNmb3JtLW9yaWdpbjo1MCUgNTAlO3N0cm9rZS1kYXNoYXJyYXk6MzAwIi8+PC9zdmc+Cg==',0,'active','2025-09-22','2025-09-22 08:14:31','2025-09-22 08:14:31');
INSERT INTO tools VALUES('43210ba9-e2cc-4ee2-9a20-f8f4c1458685','VirusTotal','FB 网站过审检测','482a552d-b451-4f0a-a1d0-4d832a59958e','https://www.virustotal.com/gui/images/manifest/icon-192x192.png',0,'active','2025-09-22','2025-09-22 08:17:21','2025-09-22 08:17:21');
INSERT INTO tools VALUES('78d1b64e-e433-454b-8abd-f56e24ac7864','Base64 编解码','支持文本编码/解码、按列换行以及结果一键复制，方便处理日志和令牌。','development','https://static.thenounproject.com/png/7681674-200.png',1,'active','2025-09-22','2025-09-22 08:55:04','2025-09-22 08:55:04');
CREATE TABLE tool_environments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  is_external BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
);
INSERT INTO tool_environments VALUES(17,'a21d8fad-551e-48e9-b7e6-538e8de83231','production','生产环境','https://kibana.qiliangjia.org/app/home',1,'2025-09-16 02:08:02','2025-09-16 02:08:02');
INSERT INTO tool_environments VALUES(24,'dc948435-e177-475d-af3d-292534c33947','production','生产环境','https://cicd.qiliangjia.org/view/qlj',1,'2025-09-16 02:12:29','2025-09-16 02:12:29');
INSERT INTO tool_environments VALUES(31,'7cdfa366-a184-40af-8261-e5ffc449d225','production','生产环境','https://apollo-portal.qiliangjia.org/config.html',1,'2025-09-16 02:46:32','2025-09-16 02:46:32');
INSERT INTO tool_environments VALUES(32,'7cdfa366-a184-40af-8261-e5ffc449d225','test','测试环境','https://apollo-portal-test.qiliangjia.org/config.html',1,'2025-09-16 02:46:32','2025-09-16 02:46:32');
INSERT INTO tool_environments VALUES(34,'e45e32df-edb7-4fd3-b83e-1afd4deddee9','production','生产环境','https://dash.cloudflare.com/4afe694ac3841dc3e433b6369c754346/home',1,'2025-09-16 03:18:13','2025-09-16 03:18:13');
INSERT INTO tool_environments VALUES(35,'1b38545d-6060-4486-9654-e94f8063ab61','production','生产环境','https://growthbook.qiliangjia.org',1,'2025-09-16 05:57:22','2025-09-16 05:57:22');
INSERT INTO tool_environments VALUES(36,'46c44ebc-880a-480c-acad-0b867ed23c87','production','生产环境','https://qlj-fe-i18n.qiliangjia.org',1,'2025-09-16 06:01:21','2025-09-16 06:01:21');
INSERT INTO tool_environments VALUES(38,'3f058b10-6c40-48fa-9693-4307b532a5f1','production','生产环境','https://yaoshi-tracking-web.qiliangjia.one',1,'2025-09-16 06:04:34','2025-09-16 06:04:34');
INSERT INTO tool_environments VALUES(39,'3f058b10-6c40-48fa-9693-4307b532a5f1','test','测试环境','https://yaoshi-tracking-web-test.qiliangjia.one',1,'2025-09-16 06:04:34','2025-09-16 06:04:34');
INSERT INTO tool_environments VALUES(45,'0277fcf4-e502-431d-a29e-8028cc6ddebf','production','生产环境','https://data-bi.qiliangjia.org/',1,'2025-09-19 11:33:05','2025-09-19 11:33:05');
INSERT INTO tool_environments VALUES(47,'4d321857-c3f1-4996-9d32-e20eec9701ee','production','生产环境','https://console.deepclick.com',1,'2025-09-22 06:00:53','2025-09-22 06:00:53');
INSERT INTO tool_environments VALUES(48,'4d321857-c3f1-4996-9d32-e20eec9701ee','test','测试环境','https://console-test-deepclick.qiliangjia.one',1,'2025-09-22 06:00:53','2025-09-22 06:00:53');
INSERT INTO tool_environments VALUES(53,'57cfcfe0-8e3e-4b60-94e7-c02c3ceff999','production','生产环境','/tools/url-parser',0,'2025-09-22 07:42:10','2025-09-22 07:42:10');
INSERT INTO tool_environments VALUES(54,'6c15bb01-5b64-40d9-ab42-08ff3df37c4c','production','生产环境','/tools/json-formatter',0,'2025-09-22 07:42:37','2025-09-22 07:42:37');
INSERT INTO tool_environments VALUES(55,'4d7b4ba7-da42-4df2-b56e-8f5e42eaddd4','production','生产环境','https://project.qiliangjia.com',1,'2025-09-22 07:54:11','2025-09-22 07:54:11');
INSERT INTO tool_environments VALUES(56,'bd04e5f9-2c37-4331-a873-0e6252d2e750','production','生产环境','https://www.roibest.com/docs',1,'2025-09-22 08:11:35','2025-09-22 08:11:35');
INSERT INTO tool_environments VALUES(57,'bd04e5f9-2c37-4331-a873-0e6252d2e750','test','测试环境','https://www-stg-roibest.qiliangjia.one/docs',1,'2025-09-22 08:11:35','2025-09-22 08:11:35');
INSERT INTO tool_environments VALUES(58,'786df662-79b5-446a-bde5-4bd282788a6c','test','测试环境','https://mis-admin-stg.qiliangjia.one/version-manager',1,'2025-09-22 08:12:31','2025-09-22 08:12:31');
INSERT INTO tool_environments VALUES(59,'786df662-79b5-446a-bde5-4bd282788a6c','production','生产环境','https://roibest-mis-admin.qiliangjia.org/version-manager',1,'2025-09-22 08:12:31','2025-09-22 08:12:31');
INSERT INTO tool_environments VALUES(60,'b31e0059-d962-495e-8810-8a5399437bd1','production','生产环境','https://866fa6c26852.sentry.io',1,'2025-09-22 08:14:31','2025-09-22 08:14:31');
INSERT INTO tool_environments VALUES(61,'43210ba9-e2cc-4ee2-9a20-f8f4c1458685','production','生产环境','https://www.virustotal.com/gui/home/url',1,'2025-09-22 08:17:21','2025-09-22 08:17:21');
INSERT INTO tool_environments VALUES(64,'78d1b64e-e433-454b-8abd-f56e24ac7864','production','生产环境','/tools/base64-converter',0,'2025-09-22 08:57:10','2025-09-22 08:57:10');
CREATE TABLE tool_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE,
  UNIQUE (tool_id, tag)
);
INSERT INTO tool_tags VALUES(40,'dc948435-e177-475d-af3d-292534c33947','CI','2025-09-16 02:12:29');
INSERT INTO tool_tags VALUES(41,'dc948435-e177-475d-af3d-292534c33947','CD','2025-09-16 02:12:29');
INSERT INTO tool_tags VALUES(42,'dc948435-e177-475d-af3d-292534c33947','部署','2025-09-16 02:12:29');
INSERT INTO tool_tags VALUES(48,'7cdfa366-a184-40af-8261-e5ffc449d225','配置中心','2025-09-16 02:46:32');
INSERT INTO tool_tags VALUES(51,'e45e32df-edb7-4fd3-b83e-1afd4deddee9','云服务','2025-09-16 03:18:13');
INSERT INTO tool_tags VALUES(52,'e45e32df-edb7-4fd3-b83e-1afd4deddee9','部署','2025-09-16 03:18:13');
INSERT INTO tool_tags VALUES(53,'1b38545d-6060-4486-9654-e94f8063ab61','灰度','2025-09-16 05:57:22');
INSERT INTO tool_tags VALUES(54,'1b38545d-6060-4486-9654-e94f8063ab61','FeatureFlag','2025-09-16 05:57:22');
INSERT INTO tool_tags VALUES(55,'46c44ebc-880a-480c-acad-0b867ed23c87','i18n','2025-09-16 06:01:21');
INSERT INTO tool_tags VALUES(56,'46c44ebc-880a-480c-acad-0b867ed23c87','多语言','2025-09-16 06:01:21');
INSERT INTO tool_tags VALUES(59,'3f058b10-6c40-48fa-9693-4307b532a5f1','AI','2025-09-16 06:04:34');
INSERT INTO tool_tags VALUES(60,'3f058b10-6c40-48fa-9693-4307b532a5f1','任务管理','2025-09-16 06:04:34');
INSERT INTO tool_tags VALUES(66,'4d321857-c3f1-4996-9d32-e20eec9701ee','DeepClick','2025-09-22 06:00:53');
INSERT INTO tool_tags VALUES(67,'4d321857-c3f1-4996-9d32-e20eec9701ee','业务项目','2025-09-22 06:00:53');
INSERT INTO tool_tags VALUES(71,'57cfcfe0-8e3e-4b60-94e7-c02c3ceff999','tools','2025-09-22 07:42:10');
INSERT INTO tool_tags VALUES(72,'6c15bb01-5b64-40d9-ab42-08ff3df37c4c','formatter','2025-09-22 07:42:37');
INSERT INTO tool_tags VALUES(73,'4d7b4ba7-da42-4df2-b56e-8f5e42eaddd4','project','2025-09-22 07:54:11');
INSERT INTO tool_tags VALUES(74,'bd04e5f9-2c37-4331-a873-0e6252d2e750','ROIBest','2025-09-22 08:11:35');
INSERT INTO tool_tags VALUES(75,'bd04e5f9-2c37-4331-a873-0e6252d2e750','文档','2025-09-22 08:11:35');
INSERT INTO tool_tags VALUES(76,'786df662-79b5-446a-bde5-4bd282788a6c','RB','2025-09-22 08:12:31');
INSERT INTO tool_tags VALUES(77,'786df662-79b5-446a-bde5-4bd282788a6c','版本管理','2025-09-22 08:12:31');
INSERT INTO tool_tags VALUES(78,'786df662-79b5-446a-bde5-4bd282788a6c','Roibest','2025-09-22 08:12:31');
INSERT INTO tool_tags VALUES(79,'b31e0059-d962-495e-8810-8a5399437bd1','错误监控','2025-09-22 08:14:31');
INSERT INTO tool_tags VALUES(80,'b31e0059-d962-495e-8810-8a5399437bd1','APM','2025-09-22 08:14:31');
INSERT INTO tool_tags VALUES(85,'78d1b64e-e433-454b-8abd-f56e24ac7864','base64','2025-09-22 08:57:10');
INSERT INTO tool_tags VALUES(86,'78d1b64e-e433-454b-8abd-f56e24ac7864','编解码工具','2025-09-22 08:57:10');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('tool_environments',64);
INSERT INTO sqlite_sequence VALUES('tool_tags',86);
CREATE INDEX idx_tools_category ON tools (category);
CREATE INDEX idx_tools_status ON tools (status);
CREATE INDEX idx_tool_environments_tool_id ON tool_environments (tool_id);
CREATE INDEX idx_tool_tags_tool_id ON tool_tags (tool_id);
CREATE INDEX idx_tool_tags_tag ON tool_tags (tag);

CREATE TABLE tool_usage_events (
	id TEXT PRIMARY KEY,
	tool_id TEXT NOT NULL,
	used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (tool_id) REFERENCES tools (id)
);

CREATE INDEX idx_tool_usage_tool_id ON tool_usage_events (tool_id);
CREATE INDEX idx_tool_usage_used_at ON tool_usage_events (used_at);
