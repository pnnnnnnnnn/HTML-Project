這是一個整合了會員系統、購物車邏輯與第三方支付功能的完整全端電商網站。

## 🚀 核心功能
* **會員驗證系統**：整合 Firebase Auth，實作註冊、登入與狀態持久化。
* **商品動態管理**：根據分類篩選商品，並實作響應式 UI。
* **完整購物流程**：包含購物車增刪改查、結帳前自動進行登入檢查。
* **第三方支付串接**：後端 Node.js 處理綠界 (ECPay) AIO 支付簽章，實作真實金流跳轉。
* **訂單持久化**：付款後自動將訂單資訊寫入 Firestore，供使用者查詢。

## 🛠 使用技術
* **前端**：JavaScript (ES6+), HTML5, CSS3, SweetAlert2 (彈窗 UI)
* **後端**：Node.js, Express (處理金流簽章與 API 路由)
* **資料庫/雲端服務**：Firebase Firestore, Firebase Authentication
* **金流 API**：綠界科技 (ECPay) SDK

## 📁 專案架構
- `/index.html` - 前端主要介面
- `/JavaScript.js` - 前端邏輯 (含 Firebase 互動與結帳流程)
- `/server.js` - Node.js 後端伺服器 (金流處理)
- `/images` - 商品圖片資源
- `/Logo` - 商場圖片

## 📌 環境需求
在開始之前，請確保您的電腦已安裝：
* [Node.js](https://nodejs.org/) (建議 v18 以上版本)

## 🛠️ 安裝與啟動步驟
# 1.初始化專案環境 (若尚未建立 package.json)
npm init -y
# 2.安裝 Express 框架與相關套件
npm install express cors body-parser crypto
# 3.啟動後端伺服器
node server.js

## 💳 測試購買流程
專案已串接綠界支付測試環境。測試時請使用以下資訊：
登入/註冊：請先使用 Firebase 會員系統登入（確保訂單能正確歸戶）。
結帳資訊：點擊結帳後，系統會自動導向綠界支付頁面。
測試信用卡號：
卡號：4311-9522-2222-2222
有效日期：大於今日的任何日期 (例如 12/30)
安全碼 (CVV)：222


