/* =========================================
   SISTEMA DE VITRINE E CARRINHO - MEDFERPA
   ========================================= */

let cart = [];
let currentSlide = 0;
let slideTimer;

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização da interface
    renderProducts(productsData);
    initFAQ();
    initHeroSlider();
    initFilters();

    // Listener para ordenação
    const sortSelect = document.getElementById('sort-products');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
});

/* --- SLIDER PRINCIPAL (HERO) --- */
function initHeroSlider() {
    clearInterval(slideTimer);
    slideTimer = setInterval(() => changeSlide(currentSlide + 1), 7000);
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
    initHeroSlider(); // Reseta o timer
};

/* --- RENDERIZAÇÃO DE PRODUTOS --- */
function renderProducts(dataToRender) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (dataToRender.length === 0) {
        container.innerHTML = `<div class="no-results">Nenhum produto encontrado.</div>`;
        return;
    }

    container.innerHTML = dataToRender.map(product => {
        const firstColor = product.colors[0];
        const firstSize = product.sizes[0];
        
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
                    <div class="error-msg">Selecione Cor e Tamanho</div>
                    <h3>${product.name}</h3>
                    <p class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                </div>
            </article>
        `;
    }).join('');
}

/* --- LOGICA DOS CARDS --- */
window.moveCardSlide = (productId, direction) => {
    const card = document.getElementById(`product-${productId}`);
    const slider = document.getElementById(`slider-${productId}`);
    const totalSlides = slider.querySelectorAll('img').length;
    let current = parseInt(card.dataset.currentSlide) || 0;
    
    current = (current + direction + totalSlides) % totalSlides;
    changeCardSlide(productId, current);
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
    changeCardSlide(productId, 0);

    card.dataset.selectedColor = colorName;
    card.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatchElement.classList.add('active');
};

window.selectSize = (sizeElement, size) => {
    const card = sizeElement.closest('.product-card');
    card.dataset.selectedSize = size;
    sizeElement.parentElement.querySelectorAll('.size-item').forEach(s => s.classList.remove('selected'));
    sizeElement.classList.add('selected');
};

/* --- FILTROS --- */
function initFilters() {
    const priceInput = document.getElementById('price-filter');
    const checks = document.querySelectorAll('.filter-check');

    if (priceInput) {
        priceInput.addEventListener('input', applyFilters);
    }
    checks.forEach(c => c.addEventListener('change', applyFilters));
}

function applyFilters() {
    const priceVal = document.getElementById('price-filter').value;
    const sortVal = document.getElementById('sort-products').value;
    const checks = document.querySelectorAll('.filter-check:checked');
    
    let maxPrice = parseFloat(priceVal.replace(/\D/g, "")) / 100 || Infinity;

    const activeFilters = { model: [], sizes: [], color: [] };
    checks.forEach(c => activeFilters[c.dataset.type].push(c.value));

    let filtered = productsData.filter(p => {
        const pMatch = p.price <= maxPrice;
        const mMatch = activeFilters.model.length === 0 || activeFilters.model.includes(p.model);
        const sMatch = activeFilters.sizes.length === 0 || p.sizes.some(s => activeFilters.sizes.includes(s));
        const cMatch = activeFilters.color.length === 0 || p.colors.some(c => activeFilters.color.includes(c.name));
        return pMatch && mMatch && sMatch && cMatch;
    });

    if (sortVal === 'price-low') filtered.sort((a,b) => a.price - b.price);
    if (sortVal === 'price-high') filtered.sort((a,b) => b.price - a.price);

    renderProducts(filtered);
}

/* --- CARRINHO --- */
window.toggleCart = () => {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('cart-overlay').classList.toggle('active');
};

/* --- ADICIONAR AO CARRINHO (LÓGICA DE AGRUPAMENTO) --- */
window.addToCart = (productId) => {
    const card = document.getElementById(`product-${productId}`);
    const size = card.dataset.selectedSize;
    const color = card.dataset.selectedColor;
    const img = card.dataset.selectedImg;
    const errorMsg = card.querySelector('.error-msg');

    // 1. Validação: Impede adicionar sem tamanho selecionado
    if (!size) {
        if (errorMsg) errorMsg.style.display = 'block';
        // Scroll suave até o erro para alertar o usuário no mobile
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (errorMsg) errorMsg.style.display = 'none';

    // 2. Mecanismo de Identificação: Procura item ID + COR + TAMANHO idênticos
    const existingItem = cart.find(item => 
        item.id === productId && 
        item.size === size && 
        item.color === color
    );

    if (existingItem) {
        // Se já existe exatamente igual, apenas aumenta a quantidade
        existingItem.quantity += 1;
        console.log(`➕ Quantidade atualizada para ${existingItem.name} (${size}): ${existingItem.quantity}`);
    } else {
        // Se for uma combinação nova, adiciona como novo objeto
        const product = productsData.find(p => p.id === productId);
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            size: size,
            color: color,
            img: img,
            quantity: 1
        });
        console.log(`🛒 Novo item adicionado: ${product.name} (${color} - ${size})`);
    }

    // 3. Atualiza interface, salva no navegador e abre a lateral
    updateCartUI();
    saveCart();
    toggleCart();
};

/* --- ATUALIZAÇÃO DA INTERFACE DO CARRINHO --- */
function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-subtotal');
    const countElement = document.getElementById('global-cart-count');

    let subtotal = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 40px 20px; color: #999;">Seu carrinho está vazio.</p>`;
    } else {
        container.innerHTML = cart.map((item, index) => {
            subtotal += item.price * item.quantity;
            totalItems += item.quantity;

            // Busca os dados originais do produto para preencher os selects
            const product = productsData.find(p => p.id === item.id);

            return `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        
                        <div class="cart-item-controls">
                            <!-- Seletor de Cor -->
                            <select class="cart-select" onchange="updateCartItemProperty(${index}, 'color', this.value)">
                                ${product.colors.map(c => `<option value="${c.name}" ${c.name === item.color ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>

                            <!-- Seletor de Tamanho -->
                            <select class="cart-select" onchange="updateCartItemProperty(${index}, 'size', this.value)">
                                ${product.sizes.map(s => `<option value="${s}" ${s === item.size ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>

                            <!-- Controle de Quantidade -->
                            <div class="qty-control">
                                <button onclick="changeQty(${index}, -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="changeQty(${index}, 1)">+</button>
                            </div>
                        </div>

                        <p class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                    </div>

                    <!-- Lixeira no Canto Superior Direito -->
                    <button class="btn-remove" onclick="removeFromCart(${index})">
                        <img src="assets/icon-trash.svg" alt="Remover">
                    </button>
                </div>
            `;
        }).join('');
    }

    totalElement.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (countElement) countElement.innerText = totalItems;
}

/* --- FUNÇÕES AUXILIARES DO CARRINHO --- */

// Altera quantidade (+ ou -)
window.changeQty = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) {
        removeFromCart(index);
    } else {
        updateCartUI();
        saveCart(); // Atualiza a memória
    }
};

// Altera propriedade (Cor ou Tamanho) diretamente no carrinho
window.updateCartItemProperty = (index, property, value) => {
    cart[index][property] = value;
    
    // Se mudar a cor, precisamos atualizar a imagem para a cor correspondente
    if (property === 'color') {
        const product = productsData.find(p => p.id === cart[index].id);
        const colorData = product.colors.find(c => c.name === value);
        if (colorData) cart[index].img = colorData.images[0];
    }
        updateCartUI();
        saveCart(); // Atualiza a memória
};

// Remove item do carrinho
window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartUI();
    saveCart(); // Atualiza a memória
};

/* --- FUNÇÕES DO FAQ --- */
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.onclick = () => {
            const ans = btn.nextElementSibling;
            ans.style.display = ans.style.display === 'block' ? 'none' : 'block';
        };
    });
}

/* --- PERSISTÊNCIA DE DADOS (LOCALSTORAGE) --- */

// Salva o estado atual do carrinho no navegador
function saveCart() {
    localStorage.setItem('medferpa_cart', JSON.stringify(cart));
}

// Carrega o carrinho salvo ao abrir o site
function loadCart() {
    const savedCart = localStorage.getItem('medferpa_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartUI();
            console.log("📦 Carrinho recuperado da sessão anterior.");
        } catch (e) {
            console.error("Erro ao carregar carrinho salvo.");
            cart = [];
        }
    }
}

/* --- FUNÇÃO PARA REDIRECIONAR AO CHECKOUT --- */
window.proceedToCheckout = () => {
    // 1. Verifica se o carrinho tem itens
    if (cart.length === 0) {
        alert("Seu carrinho está vazio! Adicione produtos antes de finalizar.");
        return;
    }

    // 2. Captura o horário de entrega selecionado (se houver)
    const timeSelector = document.querySelector('.time-selector');
    if (timeSelector && timeSelector.value) {
        localStorage.setItem('selected_delivery_time', timeSelector.value);
    } else {
        // Opcional: Obrigar a escolher horário
        // alert("Por favor, selecione um horário de entrega.");
        // return;
    }

    // 3. Salva o carrinho atualizado uma última vez por segurança
    localStorage.setItem('medferpa_cart', JSON.stringify(cart));

    // 4. Redireciona para a página de checkout linear
    console.log("🚀 Redirecionando para o Checkout...");
    window.location.href = 'checkout.html';
};

// Chame o loadCart dentro do seu DOMContentLoaded original
document.addEventListener('DOMContentLoaded', () => {
    loadCart(); // <--- Adicione esta linha aqui
    renderProducts(productsData);
    initFAQ();
    initHeroSlider();
    initFilters();
});