import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc,
    collection, addDoc, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 接下來接原本的全域變數定義 ---
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
            const historyBtn = document.getElementById("historyBtn"); // 1. 抓取按鈕

            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    updateAuthUI(userData.name, userData.gender);

                    // 2. 登入成功後，顯示按鈕
                    if (historyBtn) historyBtn.style.display = "inline";
                    if (logoutBtn) logoutBtn.style.display = "inline";
                }
            } else {
                // 3. 登出後，隱藏按鈕
                if (loginBtn) {
                    loginBtn.innerText = "登入/註冊";
                    loginBtn.style.pointerEvents = "auto";
                }
                if (historyBtn) historyBtn.style.display = "none";
                if (logoutBtn) logoutBtn.style.display = "none";
            }
        });
    } catch (err) {
        console.error("Firebase 初始化失敗，請檢查 server.js 是否啟動:", err);
    }
}

// --- 3. 商品渲染功能 ---
window.filterCategory = (targetName) => {

    const navLinks = document.querySelectorAll('.sidebar ul li a');
    navLinks.forEach(link => {
        // 移除所有人的 active 類別
        link.classList.remove('active');
        // 如果連結文字包含 targetName，就加上 active (處理包含表情符號的情況)
        if (link.innerText.includes(targetName) || (targetName === '全部' && link.innerText.includes('所有商品'))) {
            link.classList.add('active');
        }
    });

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

// 計算折扣邏輯
function calculateDiscount(totalPrice) {
    let finalPrice = totalPrice;
    let discountName = "無折扣";

    if (totalPrice >= 12120) {
        finalPrice = totalPrice * 0.7;
        discountName = "雙12盛典滿額 7 折";
    } else if (totalPrice > 0) {
        finalPrice = totalPrice * 0.88;
        discountName = "全館狂歡 88 折";
    }

    return {
        finalPrice: Math.round(finalPrice), // 四捨五入
        discountName: discountName,
        saved: Math.round(totalPrice - finalPrice)
    };
}

function updateCartUI() {
    // 1. 抓取購物車數字圖示
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('.cart-count');
    if (badge) badge.innerText = totalCount;

    // 2. 抓取容器
    const cartList = document.getElementById('cart-items-list');
    const cartTotalDisplay = document.getElementById('cart-total');
    if (!cartList || !cartTotalDisplay) return;

    // 3. 渲染商品清單
    cartList.innerHTML = cart.map((item, index) => `
        <li class="cart-item">
            <div class="item-left">
                <span class="item-name">${item.name}</span>
                <span class="item-price">$${item.price}</span>
            </div>
            <div class="item-right">
                <div class="qty-control">
                    <button onclick="changeQty(${index}, -1)">-</button>
                    <span class="qty-num">${item.quantity}</span>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>
                <button class="remove-btn" style="color:red; background:none; border:none; cursor:pointer;" onclick="removeFromCart(${index})">刪除</button>
            </div>
        </li>`).join('');

    // 4. 計算總金額與折扣
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const result = calculateDiscount(totalPrice); 

    // 5. 計算湊單進度 (goalText)
    const nextLevelGoal = 12120;
    let goalText = "";
    if (totalPrice > 0 && totalPrice < nextLevelGoal) {
        const diff = nextLevelGoal - totalPrice;
        goalText = `
            <div style="background: #fff3f3; padding: 10px; border-radius: 8px; font-size: 0.9rem; color: #d00; margin-bottom: 15px; border: 1px dashed #d00; text-align: center;">
                🔥 再買 <strong>$${diff}</strong> 即可享有 <strong style="font-size: 1.1rem;">7 折</strong> 優惠！
            </div>`;
    }

    // 6. 將所有資訊組合進畫面的總計區塊
    if (totalPrice > 0) {
        cartTotalDisplay.innerHTML = `
            ${goalText} 
            <div style="font-size: 0.9rem; color: #777;">原價總計：$ ${totalPrice}</div>
            <div style="font-size: 0.9rem; color: #e63946;">套用優惠：${result.discountName}</div>
            <div style="font-size: 1.3rem; font-weight: bold; color: #333; margin-top: 8px;">
                應付總額：$ ${result.finalPrice}
            </div>
            <div style="font-size: 0.85rem; color: #28a745; font-weight: 500;">(已為您節省 $ ${result.saved})</div>
        `;
    } else {
        cartTotalDisplay.innerText = `總計金額：$ 0`;
        cartList.innerHTML = `<li style="text-align:center; color:#999; padding: 40px 0;">您的購物車目前是空的 🛒</li>`;
    }
} // <-- 確保這裡只有一個關閉的大括號

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
        // 加上 <span class="user-welcome"> 來控制顏色
        loginBtn.innerHTML = `<span class="user-welcome">您好，${name}${gender}</span>`;
        loginBtn.style.pointerEvents = "none";
        loginBtn.style.textDecoration = "none"; // 移除底線
    }
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.style.display = "inline";
    }
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
    // 1. 檢查登入 (保持不變)
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

    // 2. 檢查購物車並計算折扣
    const originalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (originalPrice <= 0) {
        Swal.fire('購物車是空的', '請先挑選商品再結帳', 'warning');
        return;
    }

    // --- ✨ 新增：取得折扣後的最終金額與資訊 ✨ ---
    const discountResult = calculateDiscount(originalPrice);
    const finalPayAmount = discountResult.finalPrice; // 這才是真正要付的錢

    const result = await Swal.fire({
        title: '確認結帳',
        html: `
            <div style="text-align: left;">
                <p>商品原價：$${originalPrice}</p>
                <p style="color: #e63946;">活動優惠：${discountResult.discountName}</p>
                <hr>
                <p style="font-size: 1.2rem; font-weight: bold;">應付總額：$${finalPayAmount}</p>
                <p style="font-size: 0.8rem; color: #777;">即將跳轉至綠界測試刷卡頁面</p>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '確定付款',
        cancelButtonText: '再考慮一下'
    });

    if (result.isConfirmed) {
        try {
            Swal.showLoading();

            // --- 修改：將「折扣後金額」存入 Firebase ---
            await addDoc(collection(db, "orders"), {
                userId: auth.currentUser.uid,
                items: cart.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                totalAmount: finalPayAmount, // 這裡存的是折後的錢
                discountInfo: discountResult.discountName, // 順便紀錄用了什麼折扣
                timestamp: new Date().toISOString(),
                status: "已送出訂單(待付款)"
            });

            // --- 修改：呼叫後端 API 時傳送「折扣後金額」 ---
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: finalPayAmount }) // 傳送折後的錢
            });

            const data = await response.json();
            const checkoutContainer = document.createElement('div');
            checkoutContainer.innerHTML = data.html;
            document.body.appendChild(checkoutContainer);

            // 清空購物車
            cart = [];
            updateCartUI();
            closeCart();

            // 執行綠界表單跳轉
            const form = checkoutContainer.querySelector('form');
            if (form) form.submit();

        } catch (error) {
            console.error("結帳發生錯誤:", error);
            Swal.fire('系統錯誤', `無法處理訂單: ${error.message}`, 'error');
        }
    }
};

//查詢紀錄
window.showOrderHistory = async () => {
    // 檢查是否登入
    if (!auth.currentUser) {
        Swal.fire('請先登入', '登入後即可查看您的購買紀錄', 'info');
        return;
    }

    Swal.fire({ title: '正在讀取紀錄...', didOpen: () => Swal.showLoading() });

    try {
        // 從 orders 集合中查詢 userId 等於當前使用者的資料
        const q = query(
            collection(db, "orders"),
            where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);

        let html = '<div style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">';

        if (querySnapshot.empty) {
            html += '<p style="text-align:center; color:#888;">尚無任何購買紀錄。</p>';
        } else {
            // 將紀錄依照時間排序（或是由前端處理排序）
            const docs = [];
            querySnapshot.forEach(doc => docs.push(doc.data()));
            docs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            docs.forEach((order) => {
                const date = new Date(order.timestamp).toLocaleString();
                html += `
                    <div style="border-bottom: 1px solid #eee; margin-bottom: 15px; padding-bottom: 10px;">
                        <div style="font-size: 0.8rem; color: #777;">購買日期：${date}</div>
                        <div style="font-weight: bold; color: #e44d26; margin: 5px 0;">總計金額：$ ${order.totalAmount}</div>
                        <ul style="list-style: none; padding-left: 0; font-size: 0.9rem;">
                            ${order.items.map(item => `
                                <li style="display: flex; justify-content: space-between;">
                                    <span>${item.name}</span>
                                    <span>x${item.quantity}</span>
                                </li>`).join('')}
                        </ul>
                    </div>`;
            });
        }
        html += '</div>';

        Swal.fire({
            title: '我的購買紀錄',
            html: html,
            confirmButtonText: '關閉',
            confirmButtonColor: '#333'
        });

    } catch (error) {
        console.error("讀取紀錄失敗:", error);
        Swal.fire('錯誤', '暫時無法取得紀錄，請稍後再試', 'error');
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

// 關閉購物車監聽全域按鍵事件
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCart();
        // 如果有會員登入視窗，也可以順便關閉
        if (typeof authModal !== 'undefined') authModal.style.display = 'none';
    }
});

// 啟動程式
startApp();