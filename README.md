# 🧠 English Learning System

<div align="center">

![Version](https://img.shields.io/badge/version-6.0-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-green?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-teal?style=for-the-badge&logo=fastapi)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey?style=for-the-badge)

**一个零依赖、开箱即用的英语词汇/短语记忆系统**

基于 FastAPI + SQLite + 原生前端，双击即启动，无需安装环境

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [截图预览](#-截图预览) • [自定义词库](#-自定义词库) • [部署文档](#-部署)

</div>

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🃏 **翻转卡片** | 正面显示英文，点击 3D 翻转查看中文，支持滑动切换 |
| ✍️ **测试模式** | 看中文→逐词输入英文，按空格逐词校验，即时反馈红/绿 |
| 🔄 **复习模式** | 基于记忆曲线算法，自动筛选需要复习的短语 |
| 📊 **学习进度** | 追踪每条短语的状态：未学习 / 学习中 / 已掌握 |
| 🔊 **发音播放** | 优先播放录制音频，无音频时自动调用浏览器语音合成 |
| 🎤 **录音功能** | 浏览器麦克风录制 → 自动转换 MP3 → 关联短语 |
| 🗂️ **分类管理** | 后台支持增删改分类和短语，支持搜索和筛选 |
| 📱 **响应式设计** | 桌面和移动端均可使用 |

---

## 🚀 快速开始

### Windows — 双击运行（推荐，零配置）

```
直接双击 start.bat
```

> 首次启动会自动使用内置 Python 环境，无需提前安装任何东西。
> 浏览器会自动打开 http://localhost:8000

### Linux / macOS

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/english-learning-system.git
cd english-learning-system/v6

# 安装依赖
pip install -r requirements.txt

# 启动（方式一：脚本启动）
bash start.sh

# 启动（方式二：手动启动）
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

浏览器打开 **http://localhost:8000** 即可使用。

---

## 📁 项目结构

```
v6/
├── app/                    # Python 后端（FastAPI）
│   ├── main.py             # 应用入口
│   ├── database.py         # SQLite 数据库操作
│   ├── models.py           # Pydantic 数据模型
│   └── routers/
│       ├── categories.py   # 分类 CRUD API
│       ├── phrases.py      # 短语 CRUD API
│       ├── progress.py     # 学习进度 API
│       ├── stats.py        # 统计数据 API
│       └── audio.py        # 音频上传/录制 API
├── public/                 # 前端静态文件
│   ├── index.html          # 学习主页面
│   ├── admin.html          # 后台管理页面
│   └── src/
│       ├── app.js          # 学习页面逻辑
│       ├── admin.js        # 后台管理逻辑
│       ├── styles.css      # 学习页面样式
│       └── admin.css       # 后台样式
├── data/
│   ├── phrases.json        # 初始种子词库（可替换为自己的）
│   └── english.db          # SQLite 数据库（首次启动自动生成）
├── pyforwindow/            # Windows 内置 Python 运行时（免安装）
├── wheels/                 # Python 离线安装包（Linux/macOS 使用）
├── requirements.txt        # Python 依赖
├── start.bat               # Windows 一键启动
└── start.sh                # Linux/macOS 启动脚本
```

---

## 🎮 使用说明

### 学习模式（首页）

1. 打开 http://localhost:8000
2. 左侧点击 ☰ 展开设置面板
3. 选择分类（如"日常口语"、"商务英语"等）
4. 选择模式：**学习 / 测试 / 复习**
5. 卡片区域：点击卡片翻转，查看中文；点击 🔊 播放发音

### 测试模式

- 显示中文，输入对应英文
- 每输入一个单词按**空格**提交，系统即时显示绿色（正确）或红色（错误）
- 按 **Enter** 或连按 3 次空格 提交本题
- 连续答对 3 次 → 标记为"已掌握" ✅

### 后台管理

打开 http://localhost:8000/admin.html

- 添加/编辑/删除分类和短语
- 为短语录制发音（需浏览器麦克风权限）
- 批量导入词库（修改 `data/phrases.json`）

---

## 📖 自定义词库

修改 `data/phrases.json`，格式如下：

```json
[
  {
    "category": "日常问候",
    "phrases": [
      { "en": "Good morning!", "zh": "早上好！" },
      { "en": "How are you?", "zh": "你好吗？" },
      { "en": "Nice to meet you.", "zh": "很高兴认识你。" }
    ]
  },
  {
    "category": "商务英语",
    "phrases": [
      { "en": "Let's schedule a meeting.", "zh": "让我们安排一次会议。" },
      { "en": "Please find attached the report.", "zh": "请查收附件报告。" }
    ]
  }
]
```

> 修改后重新启动服务，新词库会自动导入（仅首次或数据库为空时导入）。

---

## 🔌 API 文档

启动服务后，访问 **http://localhost:8000/docs** 查看完整的交互式 API 文档（Swagger UI）。

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/categories | 获取所有分类 |
| POST | /api/categories | 新建分类 |
| GET | /api/phrases | 获取短语列表（支持分类过滤） |
| POST | /api/phrases | 新建短语 |
| PUT | /api/phrases/{id} | 更新短语 |
| DELETE | /api/phrases/{id} | 删除短语 |
| POST | /api/progress/{id} | 提交答题结果 |
| GET | /api/stats | 获取统计信息 |
| GET | /api/review | 获取待复习短语 |
| POST | /api/upload-audio | 上传 MP3 音频 |
| POST | /api/record-audio/{id} | 录音并转换为 MP3 |

---

## 🛠️ 技术栈

| 层次 | 技术 | 版本 |
|------|------|------|
| 后端框架 | [FastAPI](https://fastapi.tiangolo.com/) | 0.136+ |
| 异步服务器 | [Uvicorn](https://www.uvicorn.org/) | 0.46+ |
| 数据库 | SQLite（内置，无需安装） | - |
| 音频处理 | [pydub](https://github.com/jiaaro/pydub) + ffmpeg | 0.25+ |
| 前端 | 原生 HTML + CSS + JavaScript | - |
| 数据校验 | Pydantic v2 | - |

---

## 🚢 部署

### 局域网共享（同一 WiFi 下多人使用）

```bash
# 使用 0.0.0.0 监听所有网卡（已是默认配置）
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

其他设备访问 `http://你的IP地址:8000` 即可。

### 公网部署（服务器）

```bash
# 安装 nginx（可选，用于反向代理）
# 直接运行（推荐用 screen 或 systemd 保持后台运行）
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

> ⚠️ 公网部署时，录音功能（getUserMedia）需要 HTTPS。建议配置 nginx + Let's Encrypt SSL 证书。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建新分支 `git checkout -b feature/你的功能`
3. 提交改动 `git commit -m 'feat: 添加xxx功能'`
4. 推送分支 `git push origin feature/你的功能`
5. 发起 Pull Request

---

## 📄 License

[MIT License](LICENSE) - 自由使用、修改、分发，无需授权。

---

## 🌟 如果这个项目对你有帮助，请给个 Star ⭐

