/**
 * LÓGICA DE CHECKOUT E PAGAMENTO - MEDFERPA STORE
 * Versão: v.105
 * 
 * Integração: Firebase Auth + Mercado Pago Bricks
 * Correção: Reinicialização segura do Brick de pagamento.
 */

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
const mp = new MercadoPago('APP_USR-786f2d55-857b-4ddf-9d4c-ff1d7a216ea4'); 
const bricksBuilder = mp.bricks();

let cart = JSON.parse(localStorage.getItem('medferpa_cart')) || [];
let paymentBrickController = null; // Controlador para evitar duplicidade

document.addEventListener('DOMContentLoaded', () => {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio.");
        window.location.href = 'index.html';
        return;
    }
    renderSummary();
    checkLoggedUser();
});

/**
 * Preenchimento automático de dados do usuário autenticado
 */
function checkLoggedUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('cus-email').value = user.email || "";
            const nameParts = user.displayName ? user.displayName.split(' ') : ["", ""];
            document.getElementById('cus-name').value = nameParts[0];
            document.getElementById('cus-surname').value = nameParts.slice(1).join(' ');
            
            // Busca endereço salvo no UID do usuário
            const savedAddr = JSON.parse(localStorage.getItem(`user_addr_${user.uid}`));
            if (savedAddr) {
                document.getElementById('ship-cep').value = savedAddr.cep || "";
                document.getElementById('ship-street').value = savedAddr.rua || "";
                document.getElementById('ship-number').value = savedAddr.num || "";
                document.getElementById('ship-bairro').value = savedAddr.bairro || "";
                // Preenchimento de Cidade/UF se existirem nos campos
                if(document.getElementById('ship-city')) document.getElementById('ship-city').value = savedAddr.city || "";
                if(document.getElementById('ship-state')) document.getElementById('ship-state').value = savedAddr.state || "";
            }
        }
    });
}

/**
 * Controle de Navegação entre Etapas
 */
window.goToStep = (step) => {
    // Validação simples de transição
    if (step === 2) {
        if (!document.getElementById('cus-email').value || !document.getElementById('cus-name').value) {
            return alert("Preencha seus dados de identificação.");
        }
    }

    if (step === 3) {
        if (!document.getElementById('ship-cep').value || !document.getElementById('ship-street').value) {
            return alert("Preencha o endereço de entrega.");
        }
        // Inicializa pagamento
        initMercadoPagoBrick();
    }

    // Toggle Visual
    document.querySelectorAll('.form-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    document.getElementById(`form-step-${step}`).classList.add('active');
    document.getElementById(`step-dot-${step}`).classList.add('active');
    window.scrollTo(0, 0);
};

/**
 * Renderiza Resumo Lateral
 */
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

    const formattedTotal = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('sum-subtotal').innerText = formattedTotal;
    document.getElementById('sum-total').innerText = formattedTotal;
}

/**
 * Inicialização Segura do Mercado Pago Bricks
 */
async function initMercadoPagoBrick() {
    // Se o controlador já existe, não reinicializamos para evitar bugs de DOM
    if (paymentBrickController) return;

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const userEmail = document.getElementById('cus-email').value;

    const settings = {
        initialization: {
            amount: totalAmount,
            payer: { email: userEmail },
        },
        customization: {
            paymentMethods: {
                ticket: "all",
                bankTransfer: "all",
                creditCard: "all",
                maxInstallments: 12
            },
            visual: { style: { theme: 'default' } }
        },
        callbacks: {
            onReady: () => console.log("MP Brick Pronto"),
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                return new Promise((resolve) => {
                    alert("Pagamento processado com sucesso!");
                    finishOrder(totalAmount);
                    resolve();
                });
            },
            onError: (error) => console.error("Erro MP:", error)
        },
    };

    paymentBrickController = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
}

/**
 * Finalização e Gravação do Pedido
 */
function finishOrder(totalValue) {
    const now = new Date();
    const orderId = Math.floor(100000 + Math.random() * 900000);
    
    const newOrder = {
        id: orderId,
        date: now.toLocaleDateString('pt-BR'),
        deliveryEstimate: "2 a 4 dias úteis",
        timeSlot: localStorage.getItem('medferpa_selected_time') || "Horário Comercial",
        total: `R$ ${totalValue.toFixed(2).replace('.', ',')}`,
        status: "Pagamento Aprovado",
        items: cart.map(i => `${i.quantity}x ${i.name} (${i.size})`).join(', ')
    };

    // Salva no histórico do usuário logado se houver, ou global
    const user = auth.currentUser;
    const storageKey = user ? `orders_${user.uid}` : 'medferpa_orders_guest';
    
    let orders = JSON.parse(localStorage.getItem(storageKey)) || [];
    orders.push(newOrder);
    localStorage.setItem(storageKey, JSON.stringify(orders));

    // Limpa carrinho e finaliza
    localStorage.removeItem('medferpa_cart');
    window.location.href = "dashboard.html?order=success";
}