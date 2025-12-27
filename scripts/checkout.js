import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBgYUAagQzShLLAddybvinAYP17inZkYNg",
    authDomain: "medferpa-store-1cd4d.firebaseapp.com",
    projectId: "medferpa-store-1cd4d",
    storageBucket: "medferpa-store-1cd4d.firebasestorage.app",
    messagingSenderId: "902825986740",
    appId: "1:902825986740:web:f2c1f77ffba913a65ba5e1",
    measurementId: "G-YSPZM27EEK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 2. CONFIGURAÇÃO MERCADO PAGO
// Substitua 'SUA_PUBLIC_KEY_AQUI' pela sua chave pública real do Mercado Pago
const mp = new MercadoPago('APP_USR-786f2d55-857b-4ddf-9d4c-ff1d7a216ea4'); 
const bricksBuilder = mp.bricks();

let cart = JSON.parse(localStorage.getItem('medferpa_cart')) || [];
let currentStep = 1;

/* =========================================
   3. INICIALIZAÇÃO E MONITORAMENTO
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Se o carrinho estiver vazio, volta para a home
    if (cart.length === 0) {
        alert("Seu carrinho está vazio.");
        window.location.href = 'index.html';
        return;
    }

    renderSummary();
    checkLoggedUser();
});

// Verifica se o usuário está logado para preencher os dados automaticamente
function checkLoggedUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("👤 Usuário identificado no Checkout. Preenchendo dados...");
            
            // Etapa 1: Identificação
            document.getElementById('cus-email').value = user.email || "";
            document.getElementById('cus-name').value = user.displayName?.split(' ')[0] || "";
            document.getElementById('cus-surname').value = user.displayName?.split(' ').slice(1).join(' ') || "";
            
            // Etapa 2: Busca endereço salvo no LocalStorage pelo UID do usuário
            const savedAddr = JSON.parse(localStorage.getItem(`user_addr_${user.uid}`));
            if (savedAddr) {
                document.getElementById('ship-cep').value = savedAddr.cep || "";
                document.getElementById('ship-street').value = savedAddr.rua || "";
                document.getElementById('ship-number').value = savedAddr.num || "";
                document.getElementById('ship-bairro').value = savedAddr.bairro || "";
                document.getElementById('ship-city').value = savedAddr.cidade || "";
                document.getElementById('ship-state').value = savedAddr.uf || "";
            }
        }
    });
}

/* =========================================
   4. CONTROLE DO FLUXO LINEAR (ETAPAS)
   ========================================= */

window.goToStep = (step) => {
    // Validação básica para avançar da Etapa 1 para 2
    if (step === 2) {
        const email = document.getElementById('cus-email').value;
        const name = document.getElementById('cus-name').value;
        if (!email || !name) return alert("Por favor, preencha seus dados de identificação.");
    }

    // Validação básica para avançar da Etapa 2 para 3
    if (step === 3) {
        const cep = document.getElementById('ship-cep').value;
        const street = document.getElementById('ship-street').value;
        if (!cep || !street) return alert("Por favor, preencha o endereço de entrega.");
        
        // Inicializa o Mercado Pago Bricks somente nesta etapa
        initMercadoPagoBrick();
    }

    // Gerenciamento visual das seções
    document.querySelectorAll('.form-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    document.getElementById(`form-step-${step}`).classList.add('active');
    document.getElementById(`step-dot-${step}`).classList.add('active');
    
    window.scrollTo(0, 0);
};

/* =========================================
   5. RESUMO DO PEDIDO
   ========================================= */

function renderSummary() {
    const list = document.getElementById('summary-items-list');
    let total = 0;

    list.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="sum-item">
                <span>${item.quantity}x ${item.name} (${item.size})</span>
                <span>R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }).join('');

    document.getElementById('sum-subtotal').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('sum-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

/* =========================================
   6. INTEGRAÇÃO MERCADO PAGO BRICKS
   ========================================= */

async function initMercadoPagoBrick() {
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const userEmail = document.getElementById('cus-email').value;

    const settings = {
        initialization: {
            amount: totalAmount,
            payer: {
                email: userEmail,
            },
        },
        customization: {
            paymentMethods: {
                ticket: "all",
                bankTransfer: "all",
                creditCard: "all",
                maxInstallments: 12
            },
            visual: {
                style: {
                    theme: 'default', // 'default' | 'dark' | 'bootstrap' | 'flat'
                }
            }
        },
        callbacks: {
            onReady: () => {
                console.log("✅ Mercado Pago Brick carregado com sucesso.");
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                // Em um ambiente real, você enviaria o formData para o seu BACKEND.
                // Aqui simulamos o sucesso do processamento.
                console.log("🚀 Dados do pagamento para processamento:", formData);
                
                return new Promise((resolve, reject) => {
                    alert("Pagamento aprovado! Finalizando seu pedido...");
                    finishOrder(totalAmount);
                    resolve();
                });
            },
            onError: (error) => {
                console.error("❌ Erro no Brick:", error);
                alert("Houve um erro ao carregar o pagamento. Tente novamente.");
            },
        },
    };

    // Renderiza o Brick no container definido no HTML
    window.paymentBrickController = await bricksBuilder.create(
        'payment',
        'paymentBrick_container',
        settings
    );
}

/* =========================================
   7. FINALIZAÇÃO DO PEDIDO
   ========================================= */

function finishOrder(totalValue) {
    const now = new Date();
    const delivery = new Date();
    delivery.setDate(now.getDate() + 2); // Simula 2 dias de entrega

    const newOrder = {
        id: Math.floor(100000 + Math.random() * 900000),
        date: now.toLocaleDateString('pt-BR'),
        deliveryEstimate: delivery.toLocaleDateString('pt-BR'),
        timeSlot: localStorage.getItem('medferpa_selected_time') || "Horário Comercial",
        total: `R$ ${totalValue.toFixed(2).replace('.', ',')}`,
        status: "Em separação",
        items: cart.map(i => `${i.quantity}x ${i.name} (${i.size})`).join(', ')
    };

    // Salva o pedido no histórico local
    let orders = JSON.parse(localStorage.getItem('medferpa_orders')) || [];
    orders.push(newOrder);
    localStorage.setItem('medferpa_orders', JSON.stringify(orders));

    // Limpa o carrinho e redireciona para o Dashboard
    localStorage.removeItem('medferpa_cart');
    window.location.href = "dashboard.html";
}