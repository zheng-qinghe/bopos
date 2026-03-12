#!/usr/bin/env bash
set -euo pipefail

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok 未安装"
  exit 1
fi

ngrok http 3000
