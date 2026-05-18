# 🤝 贡献指南

感谢你愿意为 English Learning System 贡献代码！

## 如何贡献

### 报告问题

- 前往 [GitHub Issues](https://github.com/YOUR_USERNAME/english-learning-system/issues) 创建 Issue
- 描述问题：复现步骤、预期行为、实际行为
- 附上环境信息（操作系统、Python 版本等）

### 提交代码

1. **Fork** 本仓库
2. **Clone** 你的 Fork：
   ```bash
   git clone https://github.com/YOUR_USERNAME/english-learning-system.git
   ```
3. **创建分支**（按功能命名）：
   ```bash
   git checkout -b feature/你的功能名
   ```
4. **编写代码**，确保符合项目风格
5. **测试**：
   ```bash
   # Windows
   start.bat
   
   # Linux/macOS
   bash start.sh
   ```
6. **提交**：
   ```bash
   git add .
   git commit -m 'feat: 添加了xxx功能'
   git push origin feature/你的功能名
   ```
7. **发起 Pull Request**，描述你的改动

## 代码规范

- Python：遵循 PEP 8
- JavaScript：使用 ES6+ 语法
- CSS：优先使用原生 CSS，不引入额外框架
- 提交信息格式：`feat:` / `fix:` / `docs:` / `refactor:`

## 添加新词库

在 `data/phrases.json` 中添加新的分类，格式参考：

```json
{
  "category": "分类名称",
  "phrases": [
    { "en": "英文内容", "zh": "中文翻译" }
  ]
}
```

## 搭建开发环境

```bash
git clone <repo-url>
cd english-learning-system/v6
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## 提问

- 公开问题 → GitHub Discussions
- BUG 反馈 → GitHub Issues

---

感谢每一位贡献者！🎉
