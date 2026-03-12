import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { BASE_URL } from '../config';

const AppContext = createContext(null);

const DEFAULT_MENU = [
  { id: 1, name: '红烧肉', price: 48, category: '主菜', emoji: '🥩' },
  { id: 2, name: '夫妻肺片', price: 38, category: '凉菜', emoji: '🥗' },
  { id: 3, name: '麻婆豆腐', price: 28, category: '主菜', emoji: '🫘' },
  { id: 4, name: '口水鸡', price: 42, category: '凉菜', emoji: '🍗' },
  { id: 5, name: '西红柿炒蛋', price: 22, category: '家常菜', emoji: '🍳' },
  { id: 6, name: '蒜蓉虾', price: 68, category: '海鲜', emoji: '🦐' },
  { id: 7, name: '清蒸鱼', price: 88, category: '海鲜', emoji: '🐟' },
  { id: 8, name: '炒青菜', price: 18, category: '素菜', emoji: '🥬' },
  { id: 9, name: '扬州炒饭', price: 26, category: '主食', emoji: '🍚' },
  { id: 10, name: '小米粥', price: 12, category: '主食', emoji: '🥣' },
  { id: 11, name: '水煮牛肉', price: 58, category: '主菜', emoji: '🥩' },
  { id: 12, name: '酸辣白菜', price: 16, category: '素菜', emoji: '🥬' },
];

const PAYMENT_METHODS = ['微信', '支付宝', '现金', '银行卡'];
const STORAGE_KEYS = {
  menu: 'menu_v4',
  customers: 'customers_v4',
  orders: 'orders_v2',
};

function generateSampleCustomers(menu) {
  const names = ['张伟', '王芳', '李强', '刘洋', '陈静', '杨帆', '赵磊', '孙丽', '周建', '吴敏'];
  const now = Date.now();
  const day = 86400000;
  return names.map((name, i) => {
    const freq = Math.floor(Math.random() * 12) + 1;
    const orders = [];
    for (let j = 0; j < freq; j++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let total = 0;
      for (let k = 0; k < itemCount; k++) {
        const item = menu[Math.floor(Math.random() * menu.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        items.push({ ...item, qty });
        total += item.price * qty;
      }
      orders.push({
        id: `ORD-SEED-${i}-${j}`,
        date: new Date(now - daysAgo * day).toISOString(),
        items, total,
        payment: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
        customer_id: `CUST-SEED-${i}`,
        customer_name: name,
        status: 'done',
        note: '',
      });
    }
    return {
      id: `CUST-SEED-${i}`,
      name,
      phone: `138${String(10000000 + i * 7654321).slice(0, 8)}`,
      orders,
      createdAt: new Date(now - 180 * day).toISOString(),
      source: 'manual',
    };
  });
}

function parseOrders(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(order => {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    const createdAt = order.created_at || order.createdAt || order.date;
    return {
      ...order,
      items,
      date: order.date || createdAt,
      total: order.total != null ? Number(order.total) : 0,
    };
  });
}

function normalizeCustomers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(customer => ({
    ...customer,
    createdAt: customer.createdAt || customer.created_at,
    orders: customer.orders || [],
  }));
}

function hydrateCustomers(customers, orders) {
  const grouped = {};
  orders.forEach(order => {
    const key = order.customer_id || 'guest';
    grouped[key] = grouped[key] || [];
    grouped[key].push(order);
  });
  return customers.map(customer => ({
    ...customer,
    orders: grouped[customer.id] || [],
  }));
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`请求失败：${res.status}`);
  }
  const body = await res.json();
  if (!body.success) throw new Error(body.message || '服务返回失败');
  return body;
}

async function persist(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log('AsyncStorage 写入失败', e);
  }
}

export function AppProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU);
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [cachedMenu, cachedCustomers, cachedOrders] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.menu),
        AsyncStorage.getItem(STORAGE_KEYS.customers),
        AsyncStorage.getItem(STORAGE_KEYS.orders),
      ]);
      const menu = cachedMenu ? JSON.parse(cachedMenu) : DEFAULT_MENU;
      const cachedCust = cachedCustomers ? JSON.parse(cachedCustomers) : generateSampleCustomers(DEFAULT_MENU);
      const cachedOrder = cachedOrders ? JSON.parse(cachedOrders) : [];
      setMenuItems(menu);
      setCustomers(hydrateCustomers(cachedCust, cachedOrder));
      setOrders(cachedOrder);

      try {
        const [menuPayload, customersPayload, ordersPayload] = await Promise.all([
          fetchJson('/api/menu'),
          fetchJson('/api/customers'),
          fetchJson('/api/orders'),
        ]);
        const parsedOrders = parseOrders(ordersPayload.orders);
        const normalizedCustomers = normalizeCustomers(customersPayload.customers);
        const hydrated = hydrateCustomers(normalizedCustomers, parsedOrders);
        setMenuItems(menuPayload.items);
        setCustomers(hydrated);
        setOrders(parsedOrders);
        await persist(STORAGE_KEYS.menu, menuPayload.items);
        await persist(STORAGE_KEYS.customers, hydrated);
        await persist(STORAGE_KEYS.orders, parsedOrders);
      } catch (e) {
        console.log('无法获取远端数据，继续使用本地缓存', e.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    persist(STORAGE_KEYS.menu, menuItems);
  }, [menuItems, loaded]);

  useEffect(() => {
    if (!loaded) return;
    persist(STORAGE_KEYS.customers, customers);
  }, [customers, loaded]);

  useEffect(() => {
    if (!loaded) return;
    persist(STORAGE_KEYS.orders, orders);
  }, [orders, loaded]);

  const refreshMenu = useCallback(async () => {
    try {
      const { items } = await fetchJson('/api/menu');
      setMenuItems(items);
      await persist(STORAGE_KEYS.menu, items);
      return items;
    } catch (error) {
      console.log('刷新菜单失败', error.message);
      return menuItems;
    }
  }, [menuItems]);

  const refreshCustomers = useCallback(async () => {
    try {
      const { customers: data } = await fetchJson('/api/customers');
      const normalized = normalizeCustomers(data);
      const merged = hydrateCustomers(normalized, orders);
      setCustomers(merged);
      await persist(STORAGE_KEYS.customers, merged);
      return merged;
    } catch (error) {
      console.log('刷新客户失败', error.message);
      return customers;
    }
  }, [customers, orders]);

  const refreshOrders = useCallback(async () => {
    try {
      const { orders: data } = await fetchJson('/api/orders');
      const parsedOrders = parseOrders(data);
      setOrders(parsedOrders);
      await persist(STORAGE_KEYS.orders, parsedOrders);
      const merged = hydrateCustomers(customers, parsedOrders);
      setCustomers(merged);
      await persist(STORAGE_KEYS.customers, merged);
      return parsedOrders;
    } catch (error) {
      console.log('刷新订单失败', error.message);
      return orders;
    }
  }, [customers, orders]);

  useEffect(() => {
    if (!loaded) return;
    const socket = io(BASE_URL, {
      transports: ['websocket'],
      path: '/socket.io',
      reconnection: true,
    });
    socket.on('menu_updated', () => {
      refreshMenu();
    });
    socket.on('new_order', () => {
      refreshOrders();
    });
    socket.on('order_updated', () => {
      refreshOrders();
    });
    const customersTimer = setInterval(() => {
      refreshCustomers();
    }, 60000);
    return () => {
      socket.close();
      clearInterval(customersTimer);
    };
  }, [loaded, refreshMenu, refreshOrders, refreshCustomers]);

  const addMenuItem = async (item) => {
    const fallback = { ...item, id: Date.now() };
    setMenuItems(prev => [...prev, fallback]);
    try {
      await fetchJson('/api/menu', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      await refreshMenu();
    } catch (error) {
      console.log('创建菜品失败', error.message);
    }
  };

  const updateMenuItem = async (id, updates) => {
    setMenuItems(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
    try {
      await fetchJson(`/api/menu/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      await refreshMenu();
    } catch (error) {
      console.log('更新菜品失败', error.message);
    }
  };

  const deleteMenuItem = async (id) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
    try {
      await fetchJson(`/api/menu/${id}`, { method: 'DELETE' });
      await refreshMenu();
    } catch (error) {
      console.log('删除菜品失败', error.message);
    }
  };

  const registerCustomer = async (name, phone) => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const existing = customers.find(c => c.phone === trimmedPhone);
    if (existing) return { success: false, message: '该手机号已注册会员' };
    const candidate = {
      id: `CUST-${Date.now()}`,
      name: trimmedName,
      phone: trimmedPhone,
      orders: [],
      createdAt: new Date().toISOString(),
      source: 'qr',
    };
    setCustomers(prev => [candidate, ...prev]);
    try {
      const result = await fetchJson('/api/register', {
        method: 'POST',
        body: JSON.stringify({ name: trimmedName, phone: trimmedPhone }),
      });
      const newCustomer = { ...normalizeCustomers([result.customer])[0], orders: [] };
      await refreshCustomers();
      return { success: true, customer: newCustomer };
    } catch (error) {
      console.log('注册会员失败，已保存本地数据', error.message);
      return { success: true, customer: candidate };
    }
  };

  const updateCustomer = async (id, updates) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    try {
      await fetchJson(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      await refreshCustomers();
    } catch (error) {
      console.log('更新客户失败', error.message);
    }
  };

  const addOrder = async (customerId, orderData) => {
    const orderPayload = {
      customer_id: customerId,
      customer_name: customers.find(c => c.id === customerId)?.name || '散客',
      items: orderData.items,
      total: orderData.total,
      payment: orderData.payment,
      note: orderData.note || '',
    };
    const localOrder = {
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString(),
      customer_id: orderPayload.customer_id,
      customer_name: orderPayload.customer_name,
      status: 'pending',
      ...orderPayload,
    };
    setOrders(prev => [localOrder, ...prev]);
    setCustomers(prev => prev.map(c =>
      c.id === customerId
        ? { ...c, orders: [...(c.orders || []), localOrder] }
        : c
    ));
    try {
      const result = await fetchJson('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
      const persisted = parseOrders([result.order])[0];
      let nextOrders = [];
      setOrders(prev => {
        nextOrders = [persisted, ...prev.filter(o => o.id !== localOrder.id)];
        return nextOrders;
      });
      setCustomers(prev => prev.map(c =>
        c.id === customerId
          ? { ...c, orders: [...(c.orders || []).filter(o => o.id !== localOrder.id), persisted] }
          : c
      ));
      await persist(STORAGE_KEYS.orders, nextOrders);
      return persisted;
    } catch (error) {
      console.log('创建订单失败，使用本地版本', error.message);
      return localOrder;
    }
  };

  const rfmCustomers = useMemo(() => {
    const now = Date.now();
    return customers.map(customer => {
      if (!customer.orders?.length) {
        return { ...customer, recency: 999, frequency: 0, monetary: 0, segment: '一般客户', rScore: 1, fScore: 1, mScore: 1 };
      }
      const last = customer.orders.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
      const recency = Math.round((now - new Date(last.date)) / 86400000);
      const frequency = customer.orders.length;
      const monetary = customer.orders.reduce((sum, order) => sum + (order.total || 0), 0);
      return { ...customer, recency, frequency, monetary };
    });
  }, [customers]);

  // fallback to previous scoring logic in case of stale data
  const enrichedRfm = useMemo(() => {
    const withMetrics = rfmCustomers;
    const rVals = [...withMetrics.map(x => x.recency)].sort((a, b) => a - b);
    const fVals = [...withMetrics.map(x => x.frequency)].sort((a, b) => a - b);
    const mVals = [...withMetrics.map(x => x.monetary)].sort((a, b) => a - b);
    const scoreOf = (val, arr, invert) => {
      const idx = arr.indexOf(val);
      const pct = arr.length > 1 ? idx / (arr.length - 1) : 0.5;
      return Math.max(1, Math.min(5, Math.round(1 + (invert ? 1 - pct : pct) * 4)));
    };
    return withMetrics.map(c => {
      const rScore = scoreOf(c.recency, rVals, true);
      const fScore = scoreOf(c.frequency, fVals, false);
      const mScore = scoreOf(c.monetary, mVals, false);
      let segment = '一般客户';
      if (rScore >= 4 && fScore >= 4 && mScore >= 4) segment = '🌟 忠实VIP';
      else if (rScore >= 4 && fScore <= 2) segment = '🆕 新客户';
      else if (rScore <= 2 && fScore >= 4) segment = '💤 沉睡常客';
      else if (rScore <= 2 && fScore <= 2) segment = '❌ 流失客户';
      else if (mScore >= 4) segment = '💰 高价值客';
      else if (fScore >= 3 && rScore >= 3) segment = '✅ 潜力客户';
      return { ...c, rScore, fScore, mScore, segment };
    });
  }, [rfmCustomers]);

  const todayOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(order => new Date(order.date).toDateString() === today);
  }, [orders]);

  return (
    <AppContext.Provider value={{
      customers,
      rfmCustomers: enrichedRfm,
      menuItems,
      orders,
      PAYMENT_METHODS,
      loaded,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      registerCustomer,
      updateCustomer,
      addOrder,
      todayOrders,
      refreshMenu,
      refreshOrders,
      refreshCustomers,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
