

// 1. Firebase 初始化
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 注意：如果你是用 Vite 開發，保留 import.meta.env；如果是直接開檔案，請換成真實字串
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. 商品資料
const products = [
    { name: "經典款衛衣", price: 999, categories: ["全部", "上衣"] },
    { name: "保暖羽絨衣", price: 2500, categories: ["全部", "外套", "熱門"] },
    { name: "潮流棒球帽", price: 500, categories: ["全部", "配件", "熱門"] }
];

let cart = [];

// 3. 所有功能函數 (Function)
function filterCategory(targetName) {
    const title = document.getElementById('category-title');
    if (title) title.innerText = (targetName === '全部') ? '新品上市' : targetName;

    const container = document.getElementById('product-list');
    container.innerHTML = '';

    products.forEach((item, originalIndex) => {
        if (item.categories.includes(targetName)) {
            container.innerHTML += `
            <div class="product-card">
                <div class="product-img"></div>
                <h3>${item.name}</h3>
                <p>$ ${item.price}</p>
                <button class="add-to-cart" onclick="addToCart(${originalIndex})">加入購物車</button>
            </div>`;
        }
    });
}

function addToCart(index) {
    const product = products[index];
    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
    renderCart();
}

function openCart() {
    renderCart();
    document.getElementById('cart-modal').style.display = 'block';
}

function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

function renderCart() {
    const cartList = document.getElementById('cart-items-list');
    const totalDisplay = document.getElementById('cart-total');
    cartList.innerHTML = '';
    let totalPrice = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<li>購物車空空的...</li>';
        totalDisplay.innerText = '總計：$ 0';
        return;
    }

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        const li = document.createElement('li');
        li.className = "d-flex justify-content-between align-items-center py-2 border-bottom";
        li.innerHTML = `
            <div class="cart-item-info">
                <span>${item.name} - $${item.price}</span>
            </div>
            <div class="quantity-controls d-flex align-items-center gap-2">
                <button onclick="changeQuantity(${index}, -1)" class="btn btn-sm btn-outline-secondary">-</button>
                <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
                <button onclick="changeQuantity(${index}, 1)" class="btn btn-sm btn-outline-secondary">+</button>
                <button onclick="removeFromCart(${index})" class="btn btn-sm btn-danger ms-2">刪除</button>
            </div>`;
        cartList.appendChild(li);
    });
    totalDisplay.innerText = `總計：$ ${totalPrice}`;
}

function changeQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) {
        removeFromCart(index);
    } else {
        updateCartUI();
        renderCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    renderCart();
}

function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;
}

// 4. 會員彈窗邏輯 (直接在 JS 綁定，不用 window)
const authModal = document.getElementById("authModal");
const loginRegBtn = document.querySelector(".login-register-btn");
const closeBtn = document.querySelector(".close-btn");
const switchModeBtn = document.getElementById("switchModeBtn");
let isLoginMode = true;

loginRegBtn.onclick = (e) => {
    e.preventDefault();
    authModal.style.display = "block";
};

closeBtn.onclick = () => authModal.style.display = "none";

// 在 JavaScript.js 找到 switchModeBtn.onclick 的地方修改
switchModeBtn.onclick = () => {
    isLoginMode = !isLoginMode;
    
    // 1. 取得新欄位的容器
    const userInfoFields = document.getElementById("userInfoFields");
    const userNameInput = document.getElementById("userName");

    // 2. 根據模式切換顯示/隱藏
    if (isLoginMode) {
        // 登入模式：隱藏姓名格、標題換成登入
        userInfoFields.style.display = "none";
        userNameInput.required = false; // 登入不需要姓名
        document.getElementById("modalTitle").innerText = "會員登入";
        document.getElementById("mainAuthBtn").innerText = "登入";
        document.getElementById("switchHint").innerText = "還沒有帳號？";
        switchModeBtn.innerText = "帳號申請";
    } else {
        // 註冊模式：顯示姓名格、標題換成註冊
        userInfoFields.style.display = "block";
        userNameInput.required = true; // 註冊必須填姓名
        document.getElementById("modalTitle").innerText = "帳號申請";
        document.getElementById("mainAuthBtn").innerText = "立即註冊";
        document.getElementById("switchHint").innerText = "已經有帳號了？";
        switchModeBtn.innerText = "返回登入";
    }
};
// ✨ 5. 【最核心修復】：將 HTML onclick 需要的函數掛載到全域 window
window.filterCategory = filterCategory;
window.addToCart = addToCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;

// 6. 初始化執行
filterCategory('全部');