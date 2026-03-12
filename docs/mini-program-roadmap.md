# 微信小程序 + App/后厨同频方案

## 目标
- 让用户通过扫码桌贴或收银台二维码进入微信小程序，完成登录、选餐、付款。
- 让微信小程序、原生 App 与后厨显示屏共享同一套菜单、订单状态、备注与会员身份。
- 保持后端 `bopos-server` 作为事实源， App 侧保留缓存以便临时断网仍可访问信息。

## 核心数据流
1. **扫码入座/验证身份**
   - 桌贴二维码包含 `table_id`（或编码标签）。
   - 小程序启动后调用 `wx.login`，将 `code` 发给 `/api/login`（需新增），由后端换取 `openid` 并返回会员信息/在数据库中创建新会员。
2. **菜单同步**
   - App 和小程序均通过 `GET /api/menu` 拉取菜品数据，默认按 `category` 和 `sort_order` 排序。
   - App 在 `MenuScreen` 中的增删改通过 `POST/PUT/DELETE /api/menu` 操作，操作成功后触发 `io.emit('menu_updated')`，其他端通过 WebSocket 收到事件并重新拉一次 `/api/menu`。
3. **订单生命周期**
   - 小程序提交订单调用 `POST /api/orders`，携带 `table_id/table_name`、`customer_id`（或 openid）、`items`、`total`、`note`，后端写库并 `io.emit('new_order')`。
   - App 端则调用 `GET /api/orders?status=...` + 订阅 Socket 的 `new_order/order_updated` 来实时刷新收银台和订单页面。
   - 厨房显示屏继续订阅相同的 Socket，并根据 `order.status`（`pending`、`cooking`、`done`、`paid`）展示边框颜色、备注、预计完成。

## 支付与状态同步
- 小程序触发微信支付前先走 `POST /api/payments/prepay`（或与微信商户系统对接），得到 `prepay_id`，并在支付完成后调用 `PUT /api/orders/:id/status` 通知后端。
- 后端在状态变更后再次 `io.emit('order_updated')`，让 App/厨房/小程序都能看到实时进度。

## 备注与扩展
- 所有订单和菜品记录需要包含 `note` 字段，便于后厨看到特殊需求。
- 可在后端增加 `table_sessions` 表追踪每个桌号当前会话，方便小程序在桌贴扫码后携带 `session_id` 回访。
- `AppContext` 可以保留 AsyncStorage 作为缓存：启动时先尝试从后端拉数据，失败则退回本地模拟数据。

## 接下来
1. 统一把 `BASE_URL` 抽成配置（环境变量 + `src/config.js`），App/小程序/后厨显示屏都从同一个地址读取。
2. 扩展 `bopos-server`：增加微信登录 (`/api/login`)、支付准备 (`/api/payments/*`)、菜单变更事件 `io.emit('menu_updated')`。
3. 把原生 App 的菜单/客户/订单同步到后端，对 `AppContext` 进行改造：加载远端数据、执行 CRUD 时调用 REST API、订阅 Socket 获取实时变化。
4. 新建微信小程序项目：扫码带 `table_id`、加载菜单、下单、调起支付、展示付款/出餐状态、通过 Socket 监听 `order_updated`。
5. 保持后厨页面继续订阅相同 Socket，同步状态并突出备注/未支付提示。
