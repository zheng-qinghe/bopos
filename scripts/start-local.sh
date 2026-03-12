#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "node 未安装"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm 未安装"
  exit 1
fi

echo "启动后端服务..."
(
  cd "$ROOT_DIR/bopos-server"
  if [ ! -f package.json ]; then
    npm init -y >/dev/null
    npm install express cors better-sqlite3 socket.io >/dev/null
  else
    npm install >/dev/null
  fi
  node server.js
)
