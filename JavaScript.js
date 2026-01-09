// 1. Firebase 初始化與引用合併
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);

// 2. 商品資料
const products = [
    { name: "經典款衛衣", price: 999, categories: ["全部", "上衣"] },
    { name: "保暖羽絨衣", price: 2500, categories: ["全部", "外套", "熱門"] },
    { name: "潮流棒球帽", price: 500, categories: ["全部", "配件", "熱門"] }
];

let cart = [];

// 3. 所有功能函數
function filterCategory(targetName) {
    const title = document.getElementById('category-title');
    if (title) title.innerText = (targetName === '全部') ? '新品上市' : targetName;

    const container = document.getElementById('product-list');
    if (!container) return;
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

function updateAuthUI(name, gender) {
    const loginBtn = document.querySelector(".login-register-btn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (name) {
        loginBtn.innerText = `${name} ${gender} 您好`;
        loginBtn.style.pointerEvents = "none";
        if (logoutBtn) logoutBtn.style.display = "inline";
        
        if (logoutBtn) {
            logoutBtn.onclick = async (e) => {
                e.preventDefault();
                try {
                    await signOut(auth);
                    alert("已登出");
                    location.reload();
                } catch (error) {
                    console.error("登出失敗", error);
                }
            };
        }
    }
}

// 將函數掛載到全域 window 供 HTML onclick 使用
window.filterCategory = filterCategory;
window.addToCart = (index) => {
    const product = products[index];
    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) { existingItem.quantity += 1; } 
    else { cart.push({ ...product, quantity: 1 }); }
    updateCartUI();
    renderCart();
};
window.openCart = () => { renderCart(); document.getElementById('cart-modal').style.display = 'block'; };
window.closeCart = () => { document.getElementById('cart-modal').style.display = 'none'; };

function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;
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
        totalPrice += item.price * item.quantity;
        const li = document.createElement('li');
        li.className = "d-flex justify-content-between align-items-center py-2 border-bottom";
        li.innerHTML = `<span>${item.name} x ${item.quantity}</span><span>$${item.price * item.quantity}</span>`;
        cartList.appendChild(li);
    });
    totalDisplay.innerText = `總計：$ ${totalPrice}`;
}

// 4. 會員彈窗邏輯
const authModal = document.getElementById("authModal");
const loginRegBtn = document.querySelector(".login-register-btn");
const closeBtn = document.querySelector(".close-btn");
const authForm = document.getElementById("authForm");
let isLoginMode = true;

loginRegBtn.onclick = (e) => { e.preventDefault(); authModal.style.display = "block"; };
closeBtn.onclick = () => authModal.style.display = "none";

authForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;
    try {
        if (isLoginMode) {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, "users", user.uid)); 
            if (userDoc.exists()) {
                const userData = userDoc.data();
                updateAuthUI(userData.name, userData.gender);
                alert(`歡迎回來，${userData.name}`);
                authModal.style.display = "none";
            }
        }
    } catch (error) {
        alert("登入失敗，請檢查帳號密碼");
    }
};

// 6. 初始化執行
filterCategory('全部');