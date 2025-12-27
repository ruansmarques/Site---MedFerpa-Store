/**
 * LÓGICA DA PÁGINA DE DETALHES DO PRODUTO (PDP)
 * Versão: v.105
 * 
 * Este script é responsável por capturar o ID do produto na URL,
 * recuperar os dados do banco local e renderizar a interface completa.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Captura o ID do produto através dos parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'));

    // 2. Busca o produto correspondente na base de dados (products.js)
    const product = productsData.find(p => p.id === productId);

    // 3. Se o produto não existir, redireciona para a página inicial
    if (!product) {
        console.error("Produto não encontrado.");
        window.location.href = 'index.html';
        return;
    }

    // 4. Inicia a renderização dos dados na página
    renderProductDetail(product);
});

/**
 * Função principal de renderização
 */
function renderProductDetail(product) {
    // Referências do DOM
    const titleEl = document.getElementById('product-title');
    const priceEl = document.getElementById('product-price');
    const descEl = document.getElementById('product-description-full');
    const breadName = document.getElementById('breadcrumb-name');
    const breadModel = document.getElementById('breadcrumb-model');
    const techGrid = document.getElementById('tech-features');

    // Preenchimento de textos básicos
    titleEl.innerText = product.name;
    priceEl.innerText = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
    descEl.innerText = product.description;
    breadName.innerText = product.name;
    breadModel.innerText = product.model;

    // Renderização dos diferenciais técnicos (Features)
    if (product.features) {
        techGrid.innerHTML = product.features.map(feat => `
            <div class="tech-item">
                <img src="https://www.svgrepo.com/show/445167/check-circle.svg" width="20">
                <span>${feat}</span>
            </div>
        `).join('');
    }

    // Renderização dos seletores (Cores e Tamanhos)
    renderColors(product);
    renderSizes(product);

    // Inicializa a galeria com a primeira cor disponível
    updateGallery(product.colors[0]);

    // Configuração do botão de compra
    const btnBuy = document.getElementById('btn-buy-now');
    btnBuy.onclick = () => handleAddToCart(product);
}

/**
 * Renderiza as opções de cores (swatches)
 */
function renderColors(product) {
    const container = document.getElementById('color-swatches');
    const colorNameLabel = document.getElementById('selected-color-name');

    container.innerHTML = product.colors.map((color, index) => `
        <div class="swatch-item ${index === 0 ? 'active' : ''}" 
             style="background-color: ${color.hex}" 
             title="${color.name}"
             data-color-name="${color.name}"
             onclick="selectColor(this, ${JSON.stringify(color).replace(/"/g, '&quot;')})">
        </div>
    `).join('');

    // Define o nome da cor inicial
    colorNameLabel.innerText = product.colors[0].name;
}

/**
 * Lógica ao clicar em uma cor
 */
window.selectColor = (element, colorData) => {
    // Atualiza visual dos swatches
    document.querySelectorAll('.swatch-item').forEach(s => s.classList.remove('active'));
    element.classList.add('active');

    // Atualiza nome da cor no label
    document.getElementById('selected-color-name').innerText = colorData.name;

    // Atualiza a galeria de imagens
    updateGallery(colorData);
};

/**
 * Renderiza as opções de tamanhos
 */
function renderSizes(product) {
    const container = document.getElementById('size-options');
    container.innerHTML = product.sizes.map(size => `
        <div class="size-box" onclick="selectSizeDetail(this, '${size}')">${size}</div>
    `).join('');
}

/**
 * Lógica ao clicar em um tamanho
 */
window.selectSizeDetail = (element, size) => {
    document.querySelectorAll('.size-box').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    
    // Salva o tamanho selecionado no dataset do body ou em uma variável global para o botão de compra
    document.body.dataset.selectedSize = size;
    
    // Esconde mensagem de erro se estiver visível
    document.getElementById('size-error').style.display = 'none';
};

/**
 * Atualiza a galeria de fotos principal e miniaturas
 */
function updateGallery(colorData) {
    const mainImg = document.getElementById('main-product-img');
    const thumbContainer = document.getElementById('product-thumbnails');

    // Define a imagem principal como a primeira da lista da cor selecionada
    mainImg.src = colorData.images[0];

    // Gera as miniaturas
    thumbContainer.innerHTML = colorData.images.map((img, index) => `
        <div class="thumb-item ${index === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${img}')">
            <img src="${img}" alt="Miniatura">
        </div>
    `).join('');
}

/**
 * Troca a imagem principal ao clicar na miniatura
 */
window.changeMainImage = (element, imgSrc) => {
    document.getElementById('main-product-img').src = imgSrc;
    document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
};

/**
 * Lógica final de adição ao carrinho na página de detalhes
 */
function handleAddToCart(product) {
    const size = document.body.dataset.selectedSize;
    const activeColorSwatch = document.querySelector('.swatch-item.active');
    const colorName = activeColorSwatch ? activeColorSwatch.dataset.colorName : "";
    const mainImgSrc = document.getElementById('main-product-img').src;

    // Validação de tamanho
    if (!size) {
        document.getElementById('size-error').style.display = 'block';
        window.scrollTo({ top: 400, behavior: 'smooth' }); // Rola até a seleção
        return;
    }

    // Criamos o objeto do item para enviar ao carrinho
    // A função addToCart precisa estar acessível via window ou importada do main.js
    // Como estamos usando scripts tradicionais, ela deve estar no escopo global através do main.js
    
    // Simulamos a chamada da função global definida no main.js
    if (typeof window.addToCartDetail === 'function') {
        window.addToCartDetail(product.id, size, colorName, mainImgSrc);
    } else {
        // Fallback: Caso a função específica não exista, usamos a lógica do main
        // Adaptamos para o formato que o main.js espera
        const customProduct = {
            id: product.id,
            name: product.name,
            price: product.price,
            size: size,
            color: colorName,
            img: mainImgSrc,
            quantity: 1
        };
        
        // Chamada direta para adicionar e abrir carrinho
        if (window.cart) {
            const existing = window.cart.find(item => item.id === product.id && item.size === size && item.color === colorName);
            if (existing) {
                existing.quantity += 1;
            } else {
                window.cart.push(customProduct);
            }
            if (typeof window.updateCartUI === 'function') window.updateCartUI();
            if (typeof window.saveCart === 'function') window.saveCart();
            if (typeof window.toggleCart === 'function') window.toggleCart();
        }
    }
}