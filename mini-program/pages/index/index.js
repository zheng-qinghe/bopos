import { BASE_URL } from '../../utils/config';
import io from 'socket.io-client/miniprogram';

Page({
  data: {
    tableId: '',
    customer: null,
    menu: [],
    cart: [],
    statusTip: '扫码桌贴并登录即可点餐',
    loadingMenu: false,
  },

  onLoad() {
    this.loadMenu();
  },

  loadMenu() {
    this.setData({ loadingMenu: true });
    wx.request({
      url: `${BASE_URL}/api/menu`,
      success: ({ data }) => {
        if (data.success) {
          this.setData({ menu: data.items });
        }
      },
      fail: () => {
        wx.showToast({ title: '菜单拉取失败', icon: 'none' });
      },
      complete: () => this.setData({ loadingMenu: false }),
    });
  },

  handleScan() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const tableId = res.result || 'TABLE_1';
        this.setData({ tableId, statusTip: `已扫码 ${tableId}` });
        this.loginWithCode(tableId);
      },
      fail: () => {
        wx.showToast({ title: '扫码失败', icon: 'none' });
      },
    });
  },

  loginWithCode(tableId) {
    wx.login({
      success: ({ code }) => {
        wx.request({
          url: `${BASE_URL}/api/login`,
          method: 'POST',
          data: { code, phone: '', name: '微信顾客' },
          success: ({ data }) => {
            if (data.success) {
              this.setData({
                customer: data.customer,
                statusTip: `桌号 ${tableId}，欢迎 ${data.customer.name}`,
              });
              this.connectSocket();
            }
          },
          fail: () => wx.showToast({ title: '登录失败', icon: 'none' }),
        });
      },
      fail: () => wx.showToast({ title: '微信登录失败', icon: 'none' }),
    });
  },

  addToCart(event) {
    const { id } = event.currentTarget.dataset;
    const target = this.data.menu.find(item => item.id === id);
    if (!target) return;
    const cartCopy = [...this.data.cart];
    const existing = cartCopy.find(item => item.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cartCopy.push({ ...target, qty: 1 });
    }
    this.setData({ cart: cartCopy });
  },

  calcTotal() {
    return this.data.cart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
  },

  submitOrder() {
    if (!this.data.cart.length) {
      wx.showToast({ title: '请先添加菜品', icon: 'none' });
      return;
    }
    if (!this.data.tableId) {
      wx.showToast({ title: '请先扫码桌号', icon: 'none' });
      return;
    }
    const payload = {
      table_id: this.data.tableId,
      table_name: this.data.tableId,
      customer_id: this.data.customer?.id,
      customer_name: this.data.customer?.name,
      items: this.data.cart,
      total: this.calcTotal(),
      payment: '微信',
    };
    wx.request({
      url: `${BASE_URL}/api/orders`,
      method: 'POST',
      data: payload,
      success: ({ data }) => {
        if (data.success) {
          this.setData({
            statusTip: '订单已提交，正在等待支付',
            cart: [],
          });
          this.triggerPayment(data.order.id, data.order.total);
          this.listenOrderUpdates(data.order.id);
        }
      },
      fail: () => wx.showToast({ title: '下单失败', icon: 'none' }),
    });
  },

  triggerPayment(orderId, amount) {
    wx.request({
      url: `${BASE_URL}/api/payments/prepay`,
      method: 'POST',
      data: {
        order_id: orderId,
        openid: this.data.customer?.openid,
        amount,
      },
      success: ({ data }) => {
        if (data.success) {
          this.setData({
            statusTip: '支付准备完成，请完成微信支付',
          });
        }
      },
      fail: () => wx.showToast({ title: '支付接口失败', icon: 'none' }),
    });
  },

  connectSocket() {
    if (this.socket) return;
    this.socket = io(BASE_URL, {
      transports: ['websocket'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    this.socket.on('connect', () => {
      this.setData({ statusTip: '实时连接已建立' });
      this.stopPolling();
    });
    this.socket.on('connect_error', () => {
      this.setData({ statusTip: '实时连接失败，已切换轮询' });
      this.startPolling();
    });
    this.socket.on('disconnect', () => {
      this.setData({ statusTip: '实时连接断开，已切换轮询' });
      this.startPolling();
    });
    this.socket.on('menu_updated', () => {
      this.loadMenu();
    });
    this.socket.on('order_updated', (order) => {
      if (!order) return;
      if (this.latestOrderId && order.id === this.latestOrderId) {
        this.setData({ statusTip: `订单状态: ${order.status}` });
      }
    });
    this.socket.on('new_order', (order) => {
      if (!order) return;
      if (this.latestOrderId && order.id === this.latestOrderId) {
        this.setData({ statusTip: `订单状态: ${order.status}` });
      }
    });
  },

  startPolling() {
    if (this.pollingTimer) return;
    this.pollingTimer = setInterval(() => {
      if (!this.latestOrderId) return;
      wx.request({
        url: `${BASE_URL}/api/orders`,
        success: ({ data }) => {
          if (!data.success) return;
          const order = (data.orders || []).find(item => item.id === this.latestOrderId);
          if (order) {
            this.setData({ statusTip: `订单状态: ${order.status}` });
          }
        },
      });
    }, 5000);
  },

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  },

  listenOrderUpdates(orderId) {
    this.latestOrderId = orderId;
    this.setData({ statusTip: `等待订单 ${orderId} 状态更新` });
  },

  onUnload() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.stopPolling();
  },
});
