# 部署手册（后端 + 内网穿透 + 二维码）

## 1. 后端部署
1. 进入后端目录。
```bash
cd bopos-server
```
2. 安装依赖。
```bash
npm init -y
npm install express cors better-sqlite3 socket.io
```
3. 启动服务。
```bash
node server.js
```
默认监听 `http://localhost:3000`，数据库文件会自动创建在 `bopos-server/bopos.db`。

## 2. 内网穿透（示例）
### 方案 A：frp
1. 在有公网 IP 的服务器上部署 `frps`，开放 `7000` 和 `3000`（HTTP）。
2. 本地部署 `frpc`，配置示例：
```ini
[common]
server_addr = 你的公网IP
server_port = 7000

[bopos]
type = tcp
local_ip = 127.0.0.1
local_port = 3000
remote_port = 3000
```
3. 启动 `frpc`，外网通过 `http://你的公网IP:3000` 访问。

### 方案 B：ngrok
1. 启动后端服务（端口 3000）。
2. 在另一终端执行：
```bash
ngrok http 3000
```
3. 将 ngrok 提供的 https 地址配置到客户端 `BASE_URL`。

## 3. 客户端配置
### App
- 设置 `EXPO` 运行时配置：
  - `app.json` 中加入 `extra.boposServerUrl`，或通过环境变量 `BOPOS_SERVER_URL` 注入。
- 配置文件：`src/config.js`
- 配置示例：`examples/app-config.json`

### 小程序
- 修改 `mini-program/utils/config.js` 的 `BASE_URL` 为公网地址。
- 在微信开发者工具中：
  1. 导入 `mini-program` 目录。
  2. 执行 npm 构建（会生成 `miniprogram_npm`），确保 `socket.io-client` 可用。

## 4. 二维码制作
### 桌贴二维码
- 建议用固定字符串：`TABLE_1`、`TABLE_2` ...  
- 扫码后小程序会读取 `res.result` 作为桌号。

### 收银台二维码
- 建议使用 `COUNTER` 或 `TABLE_CASHIER`。
- 用于自助点单或前台收银扫码。

### 生成方式
- 可用任意在线二维码工具生成。
- 也可使用脚本批量生成：`qrencode "TABLE_1" -o table_1.png`。

## 5. 验证流程
1. 后端启动并外网可访问。
2. App 启动后能拉到远端菜单/订单。
3. 小程序扫码后登录成功，菜单显示正常。
4. 提交订单后后厨屏能实时看到订单与备注。

## 6. 一键启动脚本
- 本地启动后端：`scripts/start-local.sh`
- 启动 ngrok：`scripts/start-ngrok.sh`
