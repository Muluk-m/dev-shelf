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
INSERT INTO tool_categories VALUES('development','开发工具','代码开发和调试工具','Code','blue','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('testing','测试工具','自动化测试和质量保证工具','TestTube','green','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('deployment','部署工具','CI/CD和部署管理工具','Rocket','purple','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('monitoring','监控工具','系统监控和日志分析工具','BarChart','orange','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('database','数据库工具','数据库管理和操作工具','Database','cyan','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tool_categories VALUES('communication','协作工具','团队协作和沟通工具','MessageSquare','pink','2025-09-02 11:49:53','2025-09-02 11:49:53');
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
INSERT INTO tools VALUES('jenkins','Jenkins','持续集成和持续部署平台','deployment','',1,'active','2025-09-12','2025-09-02 11:49:53','2025-09-02 11:49:53');
INSERT INTO tools VALUES('0277fcf4-e502-431d-a29e-8028cc6ddebf','Superset','查数 BI','database','https://data-bi.qiliangjia.org/static/assets/images/favicon.png',1,'active','2025-09-16','2025-09-16 02:06:01','2025-09-16 02:06:01');
INSERT INTO tools VALUES('a21d8fad-551e-48e9-b7e6-538e8de83231','Elastic','服务日志查询','monitoring','https://kibana.qiliangjia.org/ui/favicons/favicon.svg',1,'active','2025-09-16','2025-09-16 02:08:02','2025-09-16 02:08:02');
INSERT INTO tools VALUES('7cdfa366-a184-40af-8261-e5ffc449d225','Apollo 配置中心','配置中心','development','https://apollo-portal.qiliangjia.org/img/logo-detail.png',1,'active','2025-09-16','2025-09-16 02:10:35','2025-09-16 02:10:35');
INSERT INTO tools VALUES('dc948435-e177-475d-af3d-292534c33947','Jenkins','服务部署 CI / CD','deployment','https://cicd.qiliangjia.org/static/38454d67/images/svgs/logo.svg',1,'active','2025-09-16','2025-09-16 02:12:29','2025-09-16 02:12:29');
INSERT INTO tools VALUES('4d321857-c3f1-4996-9d32-e20eec9701ee','DeepClick','业务工程','communication','https://deepclick.com/favicon.ico',1,'active','2025-09-16','2025-09-16 02:15:02','2025-09-16 02:15:02');
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
INSERT INTO tool_environments VALUES(11,'jenkins','production','生产环境','https://jenkins.example.com',1,'2025-09-12 08:50:04','2025-09-12 08:50:04');
INSERT INTO tool_environments VALUES(16,'0277fcf4-e502-431d-a29e-8028cc6ddebf','production','生产环境','https://data-bi.qiliangjia.org/',1,'2025-09-16 02:06:01','2025-09-16 02:06:01');
INSERT INTO tool_environments VALUES(17,'a21d8fad-551e-48e9-b7e6-538e8de83231','production','生产环境','https://kibana.qiliangjia.org/app/home',1,'2025-09-16 02:08:02','2025-09-16 02:08:02');
INSERT INTO tool_environments VALUES(22,'7cdfa366-a184-40af-8261-e5ffc449d225','production','生产环境','https://apollo-portal.qiliangjia.org/config.html',1,'2025-09-16 02:10:48','2025-09-16 02:10:48');
INSERT INTO tool_environments VALUES(23,'7cdfa366-a184-40af-8261-e5ffc449d225','test','测试环境','https://apollo-portal-test.qiliangjia.org/config.html',1,'2025-09-16 02:10:48','2025-09-16 02:10:48');
INSERT INTO tool_environments VALUES(24,'dc948435-e177-475d-af3d-292534c33947','production','生产环境','https://cicd.qiliangjia.org/view/qlj',1,'2025-09-16 02:12:29','2025-09-16 02:12:29');
INSERT INTO tool_environments VALUES(25,'4d321857-c3f1-4996-9d32-e20eec9701ee','production','生产环境','https://console.deepclick.com',1,'2025-09-16 02:15:02','2025-09-16 02:15:02');
INSERT INTO tool_environments VALUES(26,'4d321857-c3f1-4996-9d32-e20eec9701ee','test','测试环境','https://console-test-deepclick.qiliangjia.one',1,'2025-09-16 02:15:02','2025-09-16 02:15:02');
CREATE TABLE tool_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE,
  UNIQUE (tool_id, tag)
);
INSERT INTO tool_tags VALUES(25,'jenkins','CI/CD','2025-09-12 08:50:04');
INSERT INTO tool_tags VALUES(26,'jenkins','自动化','2025-09-12 08:50:04');
INSERT INTO tool_tags VALUES(27,'jenkins','部署','2025-09-12 08:50:04');
INSERT INTO tool_tags VALUES(39,'7cdfa366-a184-40af-8261-e5ffc449d225','配置中心','2025-09-16 02:10:48');
INSERT INTO tool_tags VALUES(40,'dc948435-e177-475d-af3d-292534c33947','CI','2025-09-16 02:12:29');
INSERT INTO tool_tags VALUES(41,'dc948435-e177-475d-af3d-292534c33947','CD','2025-09-16 02:12:29');
INSERT INTO tool_tags VALUES(42,'dc948435-e177-475d-af3d-292534c33947','部署','2025-09-16 02:12:29');
INSERT INTO tool_tags VALUES(43,'4d321857-c3f1-4996-9d32-e20eec9701ee','DeepClick','2025-09-16 02:15:02');
INSERT INTO tool_tags VALUES(44,'4d321857-c3f1-4996-9d32-e20eec9701ee','业务项目','2025-09-16 02:15:02');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('tool_environments',28);
INSERT INTO sqlite_sequence VALUES('tool_tags',46);
CREATE INDEX idx_tools_category ON tools (category);
CREATE INDEX idx_tools_status ON tools (status);
CREATE INDEX idx_tool_environments_tool_id ON tool_environments (tool_id);
CREATE INDEX idx_tool_tags_tool_id ON tool_tags (tool_id);
CREATE INDEX idx_tool_tags_tag ON tool_tags (tag);
