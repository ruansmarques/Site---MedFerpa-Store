/* =========================================
   SISTEMA CENTRAL MEDFERPA - VITRINE E CARRINHO
   ========================================= */

let cart = [];
let currentSlide = 0;
let slideTimer;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o estado do site
    loadCart(); // Recupera o carrinho do localStorage
    renderProducts(productsData); // Gera os cards iniciais
    initHeroSlider(); // Inicia o banner principal
    initFilters(); // Ativa os ouvintes dos filtros
    initFAQ(); // Ativa as perguntas frequentes

    // Listener para o seletor de Ordenação
    const sortSelect = document.getElementById('sort-products');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
});

/* =========================================
   1. BANNER PRINCIPAL (HERO SLIDER)
   ========================================= */
function initHeroSlider() {
    startSlideTimer();
}

function startSlideTimer() {
    clearInterval(slideTimer);
    slideTimer = setInterval(() => changeSlide(currentSlide + 1), 8000);
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
    startSlideTimer(); // Reinicia o tempo ao clicar manualmente
};

/* =========================================
   2. RENDERIZAÇÃO DA VITRINE
   ========================================= */
function renderProducts(dataToRender) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (dataToRender.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px;">
                <h3 style="font-size: 18px; color: #666;">Nenhum produto encontrado.</h3>
                <p style="font-size: 14px; color: #999; margin-top: 10px;">Tente ajustar os filtros de preço ou categoria.</p>
            </div>
        `;
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

                    <div class="product-card-slider" id="slider-${product.id}">
                        ${firstColor.images.map(img => `<img src="${img}" alt="${product.name}">`).join('')}
                    </div>

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
                    <div class="error-msg">Por favor, selecione um tamanho!</div>
                    <h3>${product.name}</h3>
                    <p class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                </div>
            </article>
        `;
    }).join('');
}

/* =========================================
   3. LOGICA INTERNA DOS CARDS (CORES/SLIDES)
   ========================================= */
window.moveCardSlide = (productId, direction) => {
    const card = document.getElementById(`product-${productId}`);
    const slider = document.getElementById(`slider-${productId}`);
    const totalSlides = slider.querySelectorAll('img').length;
    let current = parseInt(card.dataset.currentSlide) || 0;
    
    current = (current + direction + totalSlides) % totalSlides;
    window.changeCardSlide(productId, current);
};

window.changeCardSlide = (productId, slideIndex) => {
    const card = document.getElementById(`product-${productId}`);
    const slider = document.getElementById(`slider-${productId}`);
    const dots = card.querySelectorAll('.card-dot');
    
    if (!slider) return;
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
    if (card.querySelector('.error-msg')) card.querySelector('.error-msg').style.display = 'none';
};

/* =========================================
   4. FILTROS E ORDENAÇÃO
   ========================================= */
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

/* =========================================
   5. CARRINHO DE COMPRAS (LÓGICA E UI)
   ========================================= */
window.toggleCart = () => {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('cart-overlay').classList.toggle('active');
};

window.addToCart = (productId) => {
    const card = document.getElementById(`product-${productId}`);
    const size = card.dataset.selectedSize;
    const color = card.dataset.selectedColor;
    const img = card.dataset.selectedImg;
    const errorMsg = card.querySelector('.error-msg');

    if (!size) {
        if (errorMsg) errorMsg.style.display = 'block';
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const product = productsData.find(p => p.id === productId);
    
    // Identificação única (ID + Cor + Tamanho)
    const existing = cart.find(item => item.id === productId && item.size === size && item.color === color);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            size: size,
            color: color,
            img: img,
            quantity: 1
        });
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
    let itemsQty = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:40px 20px; color:#999;">Seu carrinho está vazio.</p>`;
    } else {
        container.innerHTML = cart.map((item, index) => {
            total += item.price * item.quantity;
            itemsQty += item.quantity;
            const prodData = productsData.find(p => p.id === item.id);

            return `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-controls">
                            <select class="cart-select" onchange="updateCartItemProperty(${index}, 'color', this.value)">
                                ${prodData.colors.map(c => `<option value="${c.name}" ${c.name === item.color ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
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
                        <img src="assets/icon-trash.svg" alt="Remover">
                    </button>
                </div>
            `;
        }).join('');
    }

    subtotalEl.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if (countEl) countEl.innerText = itemsQty;
}

window.changeQty = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) cart.splice(index, 1);
    updateCartUI();
    saveCart();
};

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

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartUI();
    saveCart();
};

/* =========================================
   6. PERSISTÊNCIA E TRANSIÇÃO (CHECKOUT)
   ========================================= */
function saveCart() {
    localStorage.setItem('medferpa_cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('medferpa_cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
            updateCartUI();
        } catch (e) { cart = []; }
    }
}

window.iniciarFluxoCheckout = () => {
    if (cart.length === 0) return alert("Seu carrinho está vazio!");
    
    // Captura horário de entrega selecionado
    const seletor = document.querySelector('.time-selector');
    if (seletor && seletor.value) {
        localStorage.setItem('medferpa_selected_time', seletor.value);
    }
    
    saveCart();
    window.location.href = 'checkout.html';
};

/* =========================================
   7. FAQ
   ========================================= */
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.onclick = () => {
            const ans = btn.nextElementSibling;
            const isOpen = ans.style.display === 'block';
            document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');
            ans.style.display = isOpen ? 'none' : 'block';
        };
    });
}