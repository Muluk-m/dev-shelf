-- 插入工具分类数据
INSERT INTO tool_categories (id, name, description, icon, color) VALUES
  ('development', '开发工具', '代码开发和调试工具', 'Code', 'blue'),
  ('testing', '测试工具', '自动化测试和质量保证工具', 'TestTube', 'green'),
  ('deployment', '部署工具', 'CI/CD和部署管理工具', 'Rocket', 'purple'),
  ('monitoring', '监控工具', '系统监控和日志分析工具', 'BarChart', 'orange'),
  ('database', '数据库工具', '数据库管理和操作工具', 'Database', 'cyan'),
  ('communication', '协作工具', '团队协作和沟通工具', 'MessageSquare', 'pink');

-- 插入工具数据
INSERT INTO tools (id, name, description, category, icon, is_internal, status, last_updated) VALUES
  ('git-lab', 'GitLab', '代码仓库管理和协作平台', 'development', 'GitBranch', TRUE, 'active', '2024-01-15'),
  ('jenkins', 'Jenkins', '持续集成和持续部署平台', 'deployment', 'Settings', TRUE, 'active', '2024-01-14'),
  ('grafana', 'Grafana', '系统监控和数据可视化平台', 'monitoring', 'BarChart3', TRUE, 'active', '2024-01-13'),
  ('sonarqube', 'SonarQube', '代码质量检测和安全扫描工具', 'testing', 'Shield', TRUE, 'active', '2024-01-12'),
  ('confluence', 'Confluence', '团队知识管理和文档协作平台', 'communication', 'FileText', TRUE, 'active', '2024-01-11'),
  ('mysql-workbench', 'MySQL Workbench', 'MySQL数据库设计和管理工具', 'database', 'Database', TRUE, 'active', '2024-01-10');

-- 插入工具环境数据
INSERT INTO tool_environments (tool_id, name, label, url, is_external) VALUES
  ('git-lab', 'production', '生产环境', 'https://gitlab.example.com', TRUE),
  ('jenkins', 'production', '生产环境', 'https://jenkins.example.com', TRUE),
  ('grafana', 'production', '生产环境', 'https://grafana.example.com', TRUE),
  ('sonarqube', 'production', '生产环境', 'https://sonarqube.example.com', TRUE),
  ('confluence', 'production', '生产环境', 'https://confluence.example.com', TRUE),
  ('mysql-workbench', 'development', '开发环境', 'https://mysql-dev.example.com', TRUE),
  ('mysql-workbench', 'staging', '测试环境', 'https://mysql-staging.example.com', TRUE);

-- 插入工具标签数据
INSERT INTO tool_tags (tool_id, tag) VALUES
  ('git-lab', 'git'),
  ('git-lab', '代码管理'),
  ('git-lab', '协作'),
  ('jenkins', 'CI/CD'),
  ('jenkins', '自动化'),
  ('jenkins', '部署'),
  ('grafana', '监控'),
  ('grafana', '可视化'),
  ('grafana', '指标'),
  ('sonarqube', '代码质量'),
  ('sonarqube', '安全'),
  ('sonarqube', '扫描'),
  ('confluence', '文档'),
  ('confluence', '知识管理'),
  ('confluence', '协作'),
  ('mysql-workbench', 'MySQL'),
  ('mysql-workbench', '数据库'),
  ('mysql-workbench', '管理');