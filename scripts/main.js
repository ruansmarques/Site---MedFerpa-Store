/* ============================================================
   1. CONFIGURAÇÕES GLOBAIS E ESTADO DO CARRINHO
   ============================================================ */
let cart = [];
let currentSlide = 0;
let slideTimer;

document.addEventListener('DOMContentLoaded', () => {
    loadCart(); 
    renderProducts(productsData); 
    initHeroSlider(); 
    initFilters(); 
    initFAQ(); 

    // Listener para o seletor de Ordenação
    const sortSelect = document.getElementById('sort-products');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
});

/* ============================================================
   2. INTERFACE E NAVEGAÇÃO (MENU, BUSCA, OVERLAY)
   ============================================================ */

// Alternar Carrinho
window.toggleCart = () => {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('cart-overlay').classList.toggle('active');
};

// Alternar Menu Mobile (Hambúrguer)
window.toggleMenuMobile = () => {
    const nav = document.getElementById('main-nav');
    const hamburger = document.getElementById('hamburger');
    if (nav) nav.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
    document.getElementById('cart-overlay').classList.toggle('active');
};

// Alternar Barra de Busca
window.toggleSearch = () => {
    // Lógica para abrir campo de busca (pode ser expandida futuramente)
    const searchTerms = prompt("O que você está procurando?");
    if (searchTerms) {
        console.log("Buscando por:", searchTerms);
        // Filtro rápido por nome
        const filtered = productsData.filter(p => 
            p.name.toLowerCase().includes(searchTerms.toLowerCase())
        );
        renderProducts(filtered);
    }
};

// Fechar todos os drawers (Carrinho e Menu) ao clicar no Overlay
window.closeAllDrawers = () => {
    document.getElementById('cart-sidebar').classList.remove('active');
    document.getElementById('cart-overlay').classList.remove('active');
    const nav = document.getElementById('main-nav');
    if (nav) nav.classList.remove('active');
};

/* ============================================================
   3. BANNER PRINCIPAL (HERO SLIDER) - INTERVALO 10 SEGUNDOS
   ============================================================ */
function initHeroSlider() {
    startSlideTimer();
}

function startSlideTimer() {
    clearInterval(slideTimer);
    // Definido exatamente 10000ms (10 segundos)
    slideTimer = setInterval(() => changeSlide(currentSlide + 1), 10000);
}

function changeSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = (index + slides.length) % slides.length;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

window.goToSlide = (index) => {
    changeSlide(index);
    startSlideTimer(); 
};

/* ============================================================
   4. RENDERIZAÇÃO DA VITRINE (PRODUTOS)
   ============================================================ */
function renderProducts(dataToRender) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (dataToRender.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px;">Nenhum produto encontrado.</div>`;
        return;
    }

    container.innerHTML = dataToRender.map(product => {
        const firstColor = product.colors[0];
        return `
            <article class="product-card" id="product-${product.id}" 
                     data-selected-color="${firstColor.name}" 
                     data-selected-img="${firstColor.images[0]}"
                     data-selected-size=""
                     data-current-slide="0">
                <div class="img-wrapper">
                    <div class="badge-container">
                        ${product.badges ? product.badges.map(b => `<span class="badge-tag">${b}</span>`).join('') : ''}
                    </div>
                    
                    <button class="card-nav-btn btn-prev-card" onclick="moveCardSlide(${product.id}, -1)">‹</button>
                    <button class="card-nav-btn btn-next-card" onclick="moveCardSlide(${product.id}, 1)">›</button>

                    <a href="product.html?id=${product.id}" style="text-decoration:none">
                        <div class="product-card-slider" id="slider-${product.id}">
                            ${firstColor.images.map(img => `<img src="${img}" alt="${product.name}">`).join('')}
                        </div>
                    </a>

                    <div class="card-dots">
                        ${firstColor.images.map((_, idx) => `
                            <span class="card-dot ${idx === 0 ? 'active' : ''}" 
                                  onclick="changeCardSlide(${product.id}, ${idx})"></span>
                        `).join('')}
                    </div>

                    <button class="btn-circle-add" onclick="addToCart(${product.id})">+</button>
                </div>
                
                <div class="selectors-container">
                    <div class="swatches">
                        ${product.colors.map((color, index) => `
                            <div class="swatch ${index === 0 ? 'active' : ''}" 
                                 style="background-color: ${color.hex}" 
                                 onclick='changeProductColor(this, ${JSON.stringify(color.images)}, "${color.name}")'>
                            </div>
                        `).join('')}
                    </div>
                    <div class="size-list">
                        ${product.sizes.map(size => `
                            <span class="size-item" onclick="selectSize(this, '${size}')">${size}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="prod-info">
                    <div class="error-msg" style="color:red; font-size:11px; display:none; margin-bottom:5px;">Selecione um tamanho!</div>
                    <h3>${product.name}</h3>
                    <p class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                </div>
            </article>
        `;
    }).join('');
}

/* ============================================================
   5. LÓGICA INTERNA DOS CARDS (SLIDES E CORES)
   ============================================================ */
window.moveCardSlide = (productId, direction) => {
    const card = document.getElementById(`product-${productId}`);
    const slider = document.getElementById(`slider-${productId}`);
    const images = slider.querySelectorAll('img');
    let current = parseInt(card.dataset.currentSlide) || 0;
    
    current = (current + direction + images.length) % images.length;
    window.changeCardSlide(productId, current);
};

window.changeCardSlide = (productId, slideIndex) => {
    const card = document.getElementById(`product-${productId}`);
    const slider = document.getElementById(`slider-${productId}`);
    const dots = card.querySelectorAll('.card-dot');
    
    if(!slider) return;
    slider.style.transform = `translateX(-${slideIndex * 100}%)`;
    dots.forEach(dot => dot.classList.remove('active'));
    if(dots[slideIndex]) dots[slideIndex].classList.add('active');
    
    card.dataset.currentSlide = slideIndex;
    const images = slider.querySelectorAll('img');
    if(images[slideIndex]) card.dataset.selectedImg = images[slideIndex].src;
};

window.changeProductColor = (swatchElement, imagesArray, colorName) => {
    const card = swatchElement.closest('.product-card');
    const slider = card.querySelector('.product-card-slider');
    const productId = card.id.replace('product-', '');

    slider.innerHTML = imagesArray.map(img => `<img src="${img}" alt="Produto">`).join('');
    window.changeCardSlide(productId, 0);

    card.dataset.selectedColor = colorName;
    card.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatchElement.classList.add('active');
};

window.selectSize = (sizeElement, size) => {
    const card = sizeElement.closest('.product-card');
    card.dataset.selectedSize = size;
    sizeElement.parentElement.querySelectorAll('.size-item').forEach(s => s.classList.remove('selected'));
    sizeElement.classList.add('selected');
    card.querySelector('.error-msg').style.display = 'none';
};

/* ============================================================
   6. FILTROS E ORDENAÇÃO
   ============================================================ */
function initFilters() {
    const priceInput = document.getElementById('price-filter');
    const checkboxes = document.querySelectorAll('.filter-check');

    if (priceInput) {
        priceInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            value = (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            e.target.value = value === "R$ 0,00" ? "" : value;
            applyFilters();
        });
    }
    checkboxes.forEach(check => check.addEventListener('change', applyFilters));
}

function applyFilters() {
    const priceInput = document.getElementById('price-filter');
    const sortValue = document.getElementById('sort-products').value;
    const checks = document.querySelectorAll('.filter-check:checked');
    
    let maxPrice = Infinity;
    if (priceInput && priceInput.value) {
        maxPrice = parseFloat(priceInput.value.replace(/[R$\s.]/g, "").replace(",", ".")) || Infinity;
    }

    const filters = { model: [], sizes: [], color: [] };
    checks.forEach(c => filters[c.dataset.type].push(c.value));

    let filtered = productsData.filter(p => {
        const pMatch = p.price <= maxPrice;
        const mMatch = filters.model.length === 0 || filters.model.includes(p.model);
        const sMatch = filters.sizes.length === 0 || p.sizes.some(s => filters.sizes.includes(s));
        const cMatch = filters.color.length === 0 || p.colors.some(c => filters.color.includes(c.name));
        return pMatch && mMatch && sMatch && cMatch;
    });

    if (sortValue === 'price-low') filtered.sort((a,b) => a.price - b.price);
    if (sortValue === 'price-high') filtered.sort((a,b) => b.price - a.price);

    renderProducts(filtered);
}

/* ============================================================
   7. CARRINHO DE COMPRAS (DETALHADO)
   ============================================================ */
window.addToCart = (productId) => {
    const card = document.getElementById(`product-${productId}`);
    const size = card.dataset.selectedSize;
    if (!size) {
        card.querySelector('.error-msg').style.display = 'block';
        return;
    }

    const product = productsData.find(p => p.id === productId);
    const color = card.dataset.selectedColor;
    const img = card.dataset.selectedImg;

    const existing = cart.find(i => i.id === productId && i.size === size && i.color === color);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: productId, name: product.name, price: product.price, size, color, img, quantity: 1 });
    }

    updateCartUI();
    saveCart();
    window.toggleCart();
};

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const countEl = document.getElementById('global-cart-count');
    let total = 0;
    let qtyCount = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:40px 20px; color:#999;">Seu carrinho está vazio.</p>`;
    } else {
        container.innerHTML = cart.map((item, index) => {
            total += item.price * item.quantity;
            qtyCount += item.quantity;
            const prodData = productsData.find(p => p.id === item.id);

            return `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-controls">
                            <!-- Troca de Cor no Carrinho -->
                            <select class="cart-select" onchange="updateCartItemProperty(${index}, 'color', this.value)">
                                ${prodData.colors.map(c => `<option value="${c.name}" ${c.name === item.color ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                            <!-- Troca de Tamanho no Carrinho -->
                            <select class="cart-select" onchange="updateCartItemProperty(${index}, 'size', this.value)">
                                ${prodData.sizes.map(s => `<option value="${s}" ${s === item.size ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                            <div class="qty-control">
                                <button onclick="changeQty(${index}, -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="changeQty(${index}, 1)">+</button>
                            </div>
                        </div>
                        <p class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${index})">
                        <img src="assets/icon-trash.svg" alt="Remover" style="width:15px; opacity:0.5;">
                    </button>
                </div>
            `;
        }).join('');
    }

    subtotalEl.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if (countEl) countEl.innerText = qtyCount;
}

window.updateCartItemProperty = (index, property, value) => {
    cart[index][property] = value;
    if (property === 'color') {
        const product = productsData.find(p => p.id === cart[index].id);
        const colorData = product.colors.find(c => c.name === value);
        if (colorData) cart[index].img = colorData.images[0];
    }
    updateCartUI();
    saveCart();
};

window.changeQty = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    updateCartUI();
    saveCart();
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartUI();
    saveCart();
};

function saveCart() { localStorage.setItem('medferpa_cart', JSON.stringify(cart)); }
function loadCart() {
    const saved = localStorage.getItem('medferpa_cart');
    if (saved) { cart = JSON.parse(saved); updateCartUI(); }
}

window.iniciarFluxoCheckout = () => {
    if (cart.length === 0) return alert("Adicione produtos para continuar.");
    window.location.href = 'checkout.html';
};

/* ============================================================
   8. PERGUNTAS FREQUENTES (FAQ ACCORDION)
   ============================================================ */
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.onclick = () => {
            const answer = btn.nextElementSibling;
            const isOpen = answer.style.display === 'block';
            document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');
            answer.style.display = isOpen ? 'none' : 'block';
        };
    });
}