let cart = [];
let currentSlide = 0;
let slideTimer;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a vitrine com todos os produtos originais
    renderProducts(productsData);
    initFAQ();
    initHeroSlider();
    initFilters();

    // Listener para o seletor de Ordenação
    const sortSelect = document.getElementById('sort-products');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
});

/* =========================================
   1. LÓGICA DO BANNER PRINCIPAL (HERO)
   ========================================= */
function initHeroSlider() {
    startSlideTimer();
}

function startSlideTimer() {
    clearInterval(slideTimer);
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

function goToSlide(index) {
    changeSlide(index);
    startSlideTimer();
}

/* =========================================
   2. RENDERIZAÇÃO DA VITRINE
   ========================================= */
function renderProducts(dataToRender) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (dataToRender.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px;">
                <h3 style="font-size: 18px; color: #666;">Nenhum produto encontrado com estes filtros.</h3>
                <p style="font-size: 14px; color: #999; margin-top: 10px;">Tente ajustar suas preferências ou limpar os filtros.</p>
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
                     data-current-slide="0">
                <div class="img-wrapper">
                    <!-- Container de Badges à Direita -->
                    <div class="badge-container">
                        ${product.badges ? product.badges.map(b => `<span class="badge-tag">${b}</span>`).join('') : ''}
                    </div>
                    
                    <!-- Setas de Navegação -->
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
                    <div class="error-msg">Selecione a Cor e Tamanho</div>
                    <h3>${product.name}</h3>
                    <p class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                </div>
            </article>
        `;
    }).join('');
}

/* =========================================
   3. NAVEGAÇÃO DOS PRODUTOS (SLIDERS INTERNOS)
   ========================================= */
function moveCardSlide(productId, direction) {
    const card = document.getElementById(`product-${productId}`);
    const slider = document.getElementById(`slider-${productId}`);
    if (!slider) return;

    const totalSlides = slider.querySelectorAll('img').length;
    let current = parseInt(card.dataset.currentSlide) || 0;
    
    current = (current + direction + totalSlides) % totalSlides;
    changeCardSlide(productId, current);
}

function changeCardSlide(productId, slideIndex) {
    const card = document.getElementById(`product-${productId}`);
    const slider = document.getElementById(`slider-${productId}`);
    const dots = card.querySelectorAll('.card-dot');
    
    if (!slider) return;

    slider.style.transform = `translateX(-${slideIndex * 100}%)`;
    
    dots.forEach(dot => dot.classList.remove('active'));
    if(dots[slideIndex]) dots[slideIndex].classList.add('active');
    
    card.dataset.currentSlide = slideIndex;
    
    const images = slider.querySelectorAll('img');
    if(images[slideIndex]) {
        card.dataset.selectedImg = images[slideIndex].src;
    }
}

function changeProductColor(swatchElement, imagesArray, colorName) {
    const card = swatchElement.closest('.product-card');
    const slider = card.querySelector('.product-card-slider');
    const productId = card.id.replace('product-', '');

    slider.innerHTML = imagesArray.map(img => `<img src="${img}" alt="Produto">`).join('');
    changeCardSlide(productId, 0);

    card.dataset.selectedColor = colorName;
    card.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatchElement.classList.add('active');
}

function selectSize(sizeElement, size) {
    const card = sizeElement.closest('.product-card');
    card.dataset.selectedSize = size;
    sizeElement.parentElement.querySelectorAll('.size-item').forEach(s => s.classList.remove('selected'));
    sizeElement.classList.add('selected');
}

/* =========================================
   4. FILTROS E ORDENAÇÃO
   ========================================= */
function initFilters() {
    const priceInput = document.getElementById('price-filter');
    const checkboxes = document.querySelectorAll('.filter-check');

    if (priceInput) {
        priceInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            value = (value / 100).toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            });
            e.target.value = value === "R$ 0,00" ? "" : value;
            applyFilters();
        });
    }

    checkboxes.forEach(check => {
        check.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    const priceInput = document.getElementById('price-filter');
    const checkboxes = document.querySelectorAll('.filter-check:checked');
    const sortValue = document.getElementById('sort-products').value;
    
    let maxPrice = Infinity;
    if (priceInput && priceInput.value) {
        maxPrice = parseFloat(priceInput.value.replace(/[R$\s.]/g, "").replace(",", ".")) || Infinity;
    }

    const activeFilters = {
        model: [],
        sizes: [],
        color: []
    };

    checkboxes.forEach(check => {
        activeFilters[check.dataset.type].push(check.value);
    });

    // 1. Filtragem cruzada
    let filtered = productsData.filter(product => {
        const matchesPrice = product.price <= maxPrice;
        const matchesModel = activeFilters.model.length === 0 || activeFilters.model.includes(product.model);
        const matchesSize = activeFilters.sizes.length === 0 || product.sizes.some(s => activeFilters.sizes.includes(s));
        const matchesColor = activeFilters.color.length === 0 || product.colors.some(c => activeFilters.color.includes(c.name));

        return matchesPrice && matchesModel && matchesSize && matchesColor;
    });

    // 2. Ordenação
    if (sortValue === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    }

    renderProducts(filtered);
}

/* =========================================
   5. CARRINHO DE COMPRAS
   ========================================= */
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('cart-overlay').classList.toggle('active');
}

function addToCart(productId) {
    const card = document.getElementById(`product-${productId}`);
    const size = card.dataset.selectedSize;
    const color = card.dataset.selectedColor;
    const img = card.dataset.selectedImg;
    const errorMsg = card.querySelector('.error-msg');

    if (!size || !color) {
        errorMsg.style.display = 'block';
        return;
    }
    errorMsg.style.display = 'none';

    const product = productsData.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId && item.size === size && item.color === color);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            size: size,
            color: color,
            img: img,
            quantity: 1,
            availableSizes: product.sizes,
            availableColors: product.colors
        });
    }

    updateCartUI();
    toggleCart();
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-subtotal');
    const countElement = document.getElementById('global-cart-count');

    let subtotal = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 20px;">Seu carrinho está vazio.</p>`;
    } else {
        container.innerHTML = cart.map((item, index) => {
            subtotal += item.price * item.quantity;
            totalItems += item.quantity;
            return `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-controls">
                            <select class="cart-select" onchange="updateCartItem(${index}, 'color', this.value)">
                                ${item.availableColors.map(c => `<option value="${c.name}" ${c.name === item.color ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                            <select class="cart-select" onchange="updateCartItem(${index}, 'size', this.value)">
                                ${item.availableSizes.map(s => `<option value="${s}" ${s === item.size ? 'selected' : ''}>${s}</option>`).join('')}
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

    totalElement.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    countElement.innerText = totalItems;
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) removeFromCart(index);
    updateCartUI();
}

function updateCartItem(index, property, value) {
    cart[index][property] = value;
    if(property === 'color') {
        const prodData = productsData.find(p => p.id === cart[index].id);
        const colorData = prodData.colors.find(c => c.name === value);
        cart[index].img = colorData.images[0];
    }
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

/* =========================================
   6. FAQ
   ========================================= */
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const answer = q.nextElementSibling;
            const icon = q.querySelector('span');
            const isOpen = answer.style.display === 'block';
            
            // Fecha todos os outros antes de abrir o novo
            document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');
            document.querySelectorAll('.faq-question span').forEach(s => s.innerText = '+');
            
            if (!isOpen) {
                answer.style.display = 'block';
                icon.innerText = '-';
            }
        });
    });
}