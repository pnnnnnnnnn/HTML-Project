const products = [
    { name: "經典款衛衣", price: 999, categories: ["全部", "上衣"] },
    { name: "保暖羽絨衣", price: 2500, categories: ["全部", "外套", "熱門"] }, // 它同時屬於三類
    { name: "潮流棒球帽", price: 500, categories: ["全部", "配件", "熱門"] }
];

function filterCategory(targetName) {
    // 1. 更新 Hero 區塊的標題文字
    const title = document.getElementById('category-title');
    if (title) {
        title.innerText = (targetName === '全部') ? '新品上市' : targetName;
    }

    // 2. 清空目前的商品列表
    const container = document.getElementById('product-list');
    container.innerHTML = '';

    // 3. 根據標籤篩選並重新畫出商品
    // 修改 filterCategory 裡的迴圈部分
    products.forEach((item, originalIndex) => { // 使用 originalIndex 確保對應原始陣列
        if (item.categories.includes(targetName)) {
            container.innerHTML += `
            <div class="product-card">
                <div class="product-img"></div>
                <h3>${item.name}</h3>
                <p>$ ${item.price}</p>
                <button class="add-to-cart" onclick="addToCart(${originalIndex})">加入購物車</button>
            </div>
        `;
        }
    });
}

let cart = [];

function addToCart(index) {
    const product = products[index];
    
    // 檢查購物車內是否已經有這個商品
    const existingItem = cart.find(item => item.name === product.name);
    
    if (existingItem) {
        existingItem.quantity += 1; // 如果有，數量 +1
    } else {
        // 如果沒有，把商品複製一份並加上數量屬性
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
    renderCart();
}

// 修正 3：讓購物車「開」跟「關」的功能動起來
function openCart() {
    renderCart(); // 加上這行，確保開起時內容是最新的
    document.getElementById('cart-modal').style.display = 'block';
}

function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

// 修正 4：把商品名稱印在購物車的小視窗裡
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
        const li = document.createElement('li');
        li.className = "d-flex justify-content-between align-items-center py-2 border-bottom";

        // 計算該項目的總額
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;

        li.innerHTML = `
            <div class="cart-item-info">
                <span>${item.name} - $${item.price}</span>
            </div>
            <div class="quantity-controls d-flex align-items-center gap-2">
                <button onclick="changeQuantity(${index}, -1)" class="btn btn-sm btn-outline-secondary">-</button>
                <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
                <button onclick="changeQuantity(${index}, 1)" class="btn btn-sm btn-outline-secondary">+</button>
                <button onclick="removeFromCart(${index})" class="btn btn-sm btn-danger ms-2">刪除</button>
            </div>
        `;
        cartList.appendChild(li);
    });

    totalDisplay.innerText = `總計：$ ${totalPrice}`;
}

function removeFromCart(index) {
    // 根據索引刪除陣列中的一筆資料
    cart.splice(index, 1);

    // 刪除後必須重新執行 UI 更新與清單渲染
    updateCartUI();
    renderCart();
}

function changeQuantity(index, delta) {
    // delta 為 1 或 -1
    cart[index].quantity += delta;

    // 如果數量小於 1，就直接移除該商品，或限制最小為 1
    if (cart[index].quantity < 1) {
        removeFromCart(index);
    } else {
        updateCartUI(); // 更新購物車圖示上的總數 (如果你想顯示總件數的話)
        renderCart();   // 重新渲染清單
    }
}

// 修正 updateCartUI 讓它顯示「件數總和」而非「類別總和」
function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;
}

filterCategory('全部');