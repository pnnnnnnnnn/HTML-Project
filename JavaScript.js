import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. 全域變數定義 ---
let db, auth;
let isLoginMode = true; 
let cart = [];

const colorMap = {
    "曜石黑": "black", "極致灰": "gray", "軍綠色": "green",
    "深藍色": "blue", "大地米": "beige", "純淨白": "white"
};

const baseTemplates = [
    { id: "sweatshirt", name: "重磅落肩大學T", price: 880, cats: ["上衣", "本季新品", "城市休閒", "熱門推薦"] },
    { id: "windbreaker", name: "機能防風連帽外套", price: 1680, cats: ["外套", "機能運動", "熱門"] },
    { id: "cargo-pants", name: "工裝多口袋長褲", price: 1350, cats: ["褲子", "本季新品", "城市休閒"] },
    { id: "sport-tee", name: "抗UV涼感訓練衫", price: 750, cats: ["上衣", "機能運動", "限時特惠"] },
    { id: "suit-pants", name: "俐落九分西裝褲", price: 1100, cats: ["褲子", "城市休閒"] },
    { id: "down-jacket", name: "極地保暖羽絨外套", price: 3200, cats: ["外套", "本季新品"] },
    { id: "baseball-cap", name: "低調刺繡棒球帽", price: 550, cats: ["配件", "熱門", "限時特惠", "熱門推薦"] },
    { id: "side-bag", name: "城市旅行側背小包", price: 890, cats: ["配件", "本季新品", "熱門推薦"] },
    { id: "oxford-shirt", name: "修身純棉長袖襯衫", price: 1050, cats: ["上衣", "城市休閒"] },
    { id: "joggers", name: "彈性束口運動褲", price: 950, cats: ["褲子", "機能運動", "熱門"] }
];

const products = [];
baseTemplates.forEach((template) => {
    Object.keys(colorMap).forEach((color) => {
        const isSale = template.cats.includes("限時特惠");
        products.push({
            name: `${color} ${template.name}`,
            price: template.price,
            originalPrice: isSale ? Math.floor(template.price * 1.4) : null,
            categories: ["全部", ...template.cats],
            image: `images/${template.id}/${template.id}-${colorMap[color]}.png`
        });
    });
});

// --- 2. 初始化 App (從後端拿配置) ---
async function startApp() {
    // 優先顯示商品，避免載入 Firebase 時空白
    filterCategory('全部');

    try {
        const res = await fetch('/api/config');
        const config = await res.json();
        const app = initializeApp(config);
        db = getFirestore(app);
        auth = getAuth(app);

        // 監聽登入狀態
        onAuthStateChanged(auth, async (user) => {
            const loginBtn = document.querySelector(".login-register-btn");
            const logoutBtn = document.getElementById("logoutBtn");
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    updateAuthUI(userData.name, userData.gender);
                }
            } else {
                if (loginBtn) {
                    loginBtn.innerText = "登入/註冊";
                    loginBtn.style.pointerEvents = "auto";
                }
                if (logoutBtn) logoutBtn.style.display = "none";
            }
        });
    } catch (err) {
        console.error("Firebase 初始化失敗，請檢查 server.js 是否啟動:", err);
    }
}

// --- 3. 商品渲染功能 ---
window.filterCategory = (targetName) => {
    const title = document.getElementById('category-title');
    if (title) {
        if (targetName === '全部') title.innerText = '所有商品';
        else if (targetName === '本季新品') title.innerText = '新品上市';
        else if (targetName === '熱門推薦') title.innerText = '🔥 本季熱門推薦';
        else title.innerText = targetName;
    }

    const container = document.getElementById('product-list');
    if (!container) return;
    container.innerHTML = '';

    products.forEach((item, originalIndex) => {
        if (item.categories.includes(targetName)) {
            const hotBadge = item.categories.includes('熱門推薦') ? `<span class="hot-badge">HOT</span>` : '';
            const priceDisplay = item.originalPrice
                ? `<p class="product-price sale"><span class="old-price">$ ${item.originalPrice}</span> <span class="new-price">$ ${item.price}</span></p>`
                : `<p class="product-price">$ ${item.price}</p>`;

            container.innerHTML += `
            <div class="product-card" style="position: relative;">
                ${hotBadge}
                <div class="product-info-top">
                    <div class="product-img-container" style="height: 200px; display: flex; justify-content: center; align-items: center; background: #f8f8f8;">
                        <img src="${item.image}" alt="${item.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                    <h3>${item.name}</h3>
                </div>
                <div class="product-info-bottom">
                    ${priceDisplay}
                    <button class="add-to-cart" onclick="addToCart(${originalIndex})">加入購物車</button>
                </div>
            </div>`;
        }
    });
};

// --- 4. 購物車邏輯 ---
window.addToCart = (index) => {
    Swal.fire({ icon: 'success', title: '已加入購物車', timer: 1000, showConfirmButton: false, toast: true, position: 'top-end' });
    const product = products[index];
    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) existingItem.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    updateCartUI();
};

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('.cart-count');
    if (badge) badge.innerText = totalCount;

    const cartList = document.getElementById('cart-items-list');
    const cartTotalDisplay = document.getElementById('cart-total');
    if (!cartList || !cartTotalDisplay) return;

    cartList.innerHTML = cart.map((item, index) => `
        <li style="display: flex; flex-direction: column; padding: 12px; border-bottom: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span style="font-weight: bold;">${item.name}</span>
                <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ff4d4d; cursor: pointer;">刪除</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="color: #e44d26;">$${item.price}</div>
                <div style="display: flex; align-items: center; border: 1px solid #ddd; border-radius: 4px;">
                    <button onclick="changeQty(${index}, -1)" style="width: 28px;">-</button>
                    <span style="padding: 0 10px;">${item.quantity}</span>
                    <button onclick="changeQty(${index}, 1)" style="width: 28px;">+</button>
                </div>
            </div>
        </li>`).join('');

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalDisplay.innerText = `總計金額：$ ${totalPrice}`;
}

window.changeQty = (index, delta) => {
    if (cart[index].quantity + delta > 0) cart[index].quantity += delta;
    else cart.splice(index, 1);
    updateCartUI();
};
window.removeFromCart = (index) => { cart.splice(index, 1); updateCartUI(); };
window.openCart = () => { document.getElementById('cart-modal').style.display = 'block'; };
window.closeCart = () => { document.getElementById('cart-modal').style.display = 'none'; };

// --- 5. 會員登入註冊 ---
const authModal = document.getElementById('authModal');
window.openAuthModal = () => { authModal.style.display = 'block'; };
document.querySelector('.close-btn').onclick = () => { authModal.style.display = 'none'; };

function updateAuthUI(name, gender) {
    const loginBtn = document.querySelector(".login-register-btn");
    if (loginBtn) {
        loginBtn.innerText = `您好，${name}${gender}`;
        loginBtn.style.pointerEvents = "none";
    }
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.style.display = "inline";
}

document.getElementById("switchModeBtn").onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById("modalTitle").innerText = isLoginMode ? "會員登入" : "帳號申請";
    document.getElementById("mainAuthBtn").innerText = isLoginMode ? "登入" : "註冊";
    document.getElementById("userInfoFields").style.display = isLoginMode ? "none" : "block";
    document.getElementById("switchModeBtn").innerText = isLoginMode ? "帳號申請" : "立即登入";
};

document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;
    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const name = document.getElementById("userName").value;
            const gender = document.getElementById("userGender").value;
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), { name, gender, email });
            alert("註冊成功！");
        }
        authModal.style.display = "none";
    } catch (error) {
        alert("驗證失敗: " + error.message);
    }
};

window.handleLogout = async () => {
    await signOut(auth);
    alert("您已成功登出");
};

// --- 6. 結帳邏輯 (含登入檢查) ---
window.checkout = async () => {
    // 檢查登入
    if (!auth || !auth.currentUser) {
        Swal.fire({
            title: '請先登入',
            text: '您必須登入後才能進行結帳',
            icon: 'warning',
            confirmButtonText: '前往登入'
        }).then((result) => {
            if (result.isConfirmed) {
                closeCart();
                openAuthModal();
            }
        });
        return;
    }

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalPrice <= 0) {
        Swal.fire('購物車是空的', '請先挑選商品再結帳', 'warning');
        return;
    }

    const result = await Swal.fire({
        title: '確認結帳',
        text: `總金額為 $${totalPrice}，即將跳轉至綠界測試刷卡頁面`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '確定'
    });

    if (result.isConfirmed) {
        try {
            Swal.showLoading();
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalPrice })
            });

            const data = await response.json();
            const checkoutContainer = document.createElement('div');
            checkoutContainer.innerHTML = data.html;
            document.body.appendChild(checkoutContainer);

            cart = []; 
            updateCartUI(); 
            closeCart();

            const form = checkoutContainer.querySelector('form');
            if (form) form.submit();
        } catch (error) {
            Swal.fire('系統錯誤', `無法連接金流伺服器: ${error.message}`, 'error');
        }
    }
};

// 關於我們
window.openAboutModal = () => {
    Swal.fire({
        title: '關於 SHOP LOGO',
        html: `
            <div style="text-align: left; line-height: 1.8;">
                <img src="Logo/Logo.png" alt="logo" class="logo-img" style="display: block; margin: 0 auto; width: 150px; height: auto;">                <p><strong>穿出城市的新節奏</strong></p>
                <p>我們專注於提供<strong>重磅大學T</strong>與<strong>機能防風外套</strong>，將高品質面料與現代剪裁結合。</p>
                <hr>
                <p>✅ 7天鑑賞期，購物最安心</p>
                <p>✅ 嚴選布料，舒適耐穿</p>
                <p>客服信箱：service@shoplogo.com</p>
            </div>
        `,
        confirmButtonText: '繼續購物',
        confirmButtonColor: '#3085d6'
    });
};

// 啟動程式
startApp();