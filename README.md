# 🍜 bopos — Boss POS

> 专为餐饮老板设计的智慧收银与客户管理系统

**bopos**（Boss POS）是一款开源的餐饮收银 + 会员管理 + 客户分析一体化工具，适用于任何规模的餐饮店。老板无需懂技术，扫码即可让顾客自助注册会员，系统自动完成 RFM 客户价值分析，帮助老板看清谁是忠实 VIP、谁在悄悄流失。

---

## ✨ 功能特性

- 🧾 **智慧收银台** — 点餐、绑定会员、多种支付方式、一键结账
- 📊 **RFM 客户分析** — 自动计算消费近度、频率、金额，智能划分 7 类客群
- 👥 **会员管理** — 扫码注册、信息编辑、消费记录追踪
- 🍽️ **菜单管理** — 老板自定义菜品、价格、分类、图标
- 📱 **微信扫码注册** — 顾客无需下载 App，扫码填写信息即成会员

---

## 🛠️ 技术栈

| 模块 | 技术 |
|------|------|
| 移动端 | React Native / Expo |
| 后端 | Node.js + Express + SQLite |
| 内网穿透 | frp |
| 会员注册页 | 纯 HTML/CSS/JS，托管于 GitHub Pages |

---

## 🚀 快速开始

### 移动端（Android APK）

```bash
git clone https://github.com/zheng-qinghe/bopos.git
cd bopos/restaurant-app
npm install
npx expo install expo-asset
npx expo prebuild --platform android --clean
cd android
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties
sed -i '' '/enableBundleCompression/d' app/build.gradle
./gradlew assembleRelease
```

APK 路径：`android/app/build/outputs/apk/release/app-release.apk`

### 后端服务器

```bash
cd bopos-server
npm install
node server.js
```

---

## 📁 项目结构

```
bopos/
├── restaurant-app/          # React Native 移动端
│   ├── src/
│   │   ├── screens/         # 收银台、RFM、客户、菜单页面
│   │   └── context/         # 全局状态管理
│   └── assets/              # 图标和启动图
├── bopos-server/            # Node.js 后端
│   └── server.js            # API 服务
└── web-register/            # 顾客扫码注册 H5 页面
    └── index.html
```

---

## 🙏 致谢

站在巨人的肩膀上，才能看得更远。

感谢所有开源技术的贡献者们——React Native、Expo、Node.js、SQLite、Express、frp 以及无数在 GitHub 上默默耕耘的开发者。正是你们的无私分享，让一个餐馆老板的想法得以变成现实。

** 希望它能帮助更多餐饮人，用技术的力量经营好自己的店。

如果这个项目对你有帮助，欢迎 Star ⭐ 支持一下！

---

## 📄 License

[MIT License](LICENSE) — 自由使用，自由修改，自由分发。
