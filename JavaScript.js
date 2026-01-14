import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// 修改這行，加入 signOut
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// --- 1. Firebase 配置防錯處理 ---
// 如果在本地直接開啟 HTML 而非透過 Vite 伺服器，import.meta.env 會報錯
const firebaseConfig = {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "YOUR_FALLBACK_API_KEY",
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env?.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 2. 變數與資料定義 ---
let isLoginMode = true; // 修正：必須先宣告，否則切換模式會報錯
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

// --- 3. 商品渲染功能 ---
function filterCategory(targetName) {
    const title = document.getElementById('category-title');
    if (title) {
        // 修改判斷邏輯
        if (targetName === '全部') {
            title.innerText = '所有商品'; // 改成你想顯示的文字
        } else if (targetName === '本季新品') {
            title.innerText = '新品上市';
        } else if (targetName === '熱門推薦') {
            title.innerText = '🔥 本季熱門推薦';
        } else {
            title.innerText = targetName;
        }
    }

    const container = document.getElementById('product-list');
    if (!container) return;

    container.innerHTML = '';

    // 修正點：使用 categories 而非 cats，因為你在產出 products 時已經改名了
    products.forEach((item, originalIndex) => {
        if (item.categories.includes(targetName)) {

            // 這裡同步修正判斷標籤的邏輯
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
}

window.filterCategory = filterCategory;

// --- 4. 購物車邏輯 ---
window.addToCart = (index) => {
    Swal.fire({ icon: 'success', title: '已加入購物車', timer: 1000, showConfirmButton: false, toast: true, position: 'top-end' });
    const product = products[index];
    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
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

// --- 5. 會員登入註冊邏輯 ---
const authModal = document.getElementById('authModal');
const closeBtn = document.querySelector('.close-btn');
const authForm = document.getElementById('authForm');

window.openAuthModal = () => { authModal.style.display = 'block'; };
if (closeBtn) closeBtn.onclick = () => { authModal.style.display = 'none'; };
window.onclick = (e) => { if (e.target == authModal) authModal.style.display = 'none'; };

// 更新登入 UI (需在 HTML 加入對應 ID)
function updateAuthUI(name, gender) {
    const loginBtn = document.querySelector(".login-register-btn");
    if (loginBtn) {
        loginBtn.innerText = `您好，${name}${gender}`;
        loginBtn.style.pointerEvents = "none";
    }
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.style.display = "inline";
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            updateAuthUI(userData.name, userData.gender);
        }
    }
});

const switchModeBtn = document.getElementById("switchModeBtn");
if (switchModeBtn) {
    switchModeBtn.onclick = () => {
        isLoginMode = !isLoginMode;
        document.getElementById("modalTitle").innerText = isLoginMode ? "會員登入" : "帳號申請";
        document.getElementById("mainAuthBtn").innerText = isLoginMode ? "登入" : "註冊";
        document.getElementById("userInfoFields").style.display = isLoginMode ? "none" : "block";
        switchModeBtn.innerText = isLoginMode ? "帳號申請" : "立即登入";
    };
}

if (authForm) {
    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById("authEmail").value;
        const password = document.getElementById("authPassword").value;

        try {
            if (isLoginMode) {
                // 登入模式
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // 註冊模式
                const name = document.getElementById("userName").value;
                const gender = document.getElementById("userGender").value;
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), { name, gender, email });
                alert("註冊成功！");
            }
            authModal.style.display = "none";
        } catch (error) {
            console.error("Firebase 錯誤代碼:", error.code); // 方便開發者調試

            // --- 自訂錯誤訊息開始 ---
            let errorMessage = "驗證失敗，請稍後再試。";

            if (error.code === 'auth/invalid-credential' ||
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/wrong-password') {
                errorMessage = "輸入帳號或密碼錯誤";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "電子郵件格式不正確";
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = "此電子郵件已被註冊";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "密碼強度不足（至少需 6 位元）";
            }

            alert(errorMessage);
            // --- 自訂錯誤訊息結束 ---
        }
    };
}

// --- 登出功能 ---
window.handleLogout = async () => {
    try {
        await signOut(auth);
        alert("您已成功登出");
        // 登出後的 UI 恢復由下方 onAuthStateChanged 自動處理
    } catch (error) {
        console.error("登出失敗:", error);
        alert("登出失敗：" + error.message);
    }
};

onAuthStateChanged(auth, async (user) => {
    const loginBtn = document.querySelector(".login-register-btn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (user) {
        // 已登入情況
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            updateAuthUI(userData.name, userData.gender);
        }
    } else {
        // 未登入情況：恢復 UI 狀態
        if (loginBtn) {
            loginBtn.innerText = "登入/註冊";
            loginBtn.style.pointerEvents = "auto"; // 恢復點擊功能
        }
        if (logoutBtn) {
            logoutBtn.style.display = "none"; // 隱藏登出按鈕
        }
    }
});

//關於我們的資料
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

// --- 6. 初始加載 ---
filterCategory('全部');

