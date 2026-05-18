#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"
APP_DIR="$(pwd)"
CACHE_DIR="$HOME/.cache/english-learning-v6"
WHEELS_DIR="$APP_DIR/wheels"
PYTHON=""

# 寻找可用 Python
find_python() {
    # 1. 优先用缓存的便携 Python（已安装好依赖）
    if [ -f "$CACHE_DIR/python/bin/python3" ]; then
        PYTHON="$CACHE_DIR/python/bin/python3"
        return 0
    fi

    # 2. 尝试从 tarball 释放便携 Python
    TARBALL=$(ls "$APP_DIR"/cpython-*-linux-*.tar.gz "$APP_DIR"/python_linux.tar.gz 2>/dev/null | head -1)
    if [ -n "$TARBALL" ]; then
        echo "首次运行，正在释放便携 Python 到缓存..."
        mkdir -p "$CACHE_DIR"
        tar xzf "$TARBALL" -C "$CACHE_DIR/"
        chmod +x "$CACHE_DIR/python/bin/python3"
        echo "正在安装依赖 (fastapi, uvicorn, ...)"
        if [ -d "$WHEELS_DIR" ]; then
            "$CACHE_DIR/python/bin/python3" -m pip install --no-index --find-links "$WHEELS_DIR" fastapi uvicorn python-multipart pydub
        else
            "$CACHE_DIR/python/bin/python3" -m pip install -q fastapi uvicorn python-multipart pydub
        fi
        PYTHON="$CACHE_DIR/python/bin/python3"
        return 0
    fi

    # 3. 回退到系统 Python
    if command -v python3 &>/dev/null; then
        PYTHON=python3
    elif command -v python &>/dev/null; then
        PYTHON=python
    else
        echo "错误: 未找到 Python，请先安装 Python 3.10+"
        exit 1
    fi

    # 系统 Python 需要安装依赖
    if ! $PYTHON -c "import fastapi" &>/dev/null 2>&1; then
        echo "正在安装依赖 (fastapi, uvicorn, ...)"
        if [ -d "$WHEELS_DIR" ]; then
            $PYTHON -m pip install --no-index --find-links "$WHEELS_DIR" fastapi uvicorn python-multipart pydub 2>/dev/null || \
            $PYTHON -m pip install -q fastapi uvicorn python-multipart pydub
        else
            $PYTHON -m pip install -q fastapi uvicorn python-multipart pydub
        fi
    fi
}

find_python

echo "========================================"
echo "    英语学习系统 V6 正在启动..."
echo "========================================"
echo ""
echo "服务已启动，请在浏览器中打开:"
echo "  http://localhost:8000"
echo ""
echo "按 Ctrl+C 可停止服务"
echo ""

$PYTHON -m uvicorn app.main:app --host 0.0.0.0 --port 8000
