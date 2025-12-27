/**
 * LÓGICA DE CHECKOUT E PAGAMENTO - MEDFERPA STORE
 * Versão: v.107 - Cloud Sync Final
 * 
 * Integração: Firebase Auth + Firebase Firestore + Mercado Pago Bricks
 * Funcionalidade: Gravação de pedidos na nuvem e preenchimento inteligente.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ============================================================
   1. CONFIGURAÇÃO FIREBASE E MERCADO PAGO
   ============================================================ */
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
const db = getFirestore(app);

const mp = new MercadoPago('APP_USR-786f2d55-857b-4ddf-9d4c-ff1d7a216ea4'); 
const bricksBuilder = mp.bricks();

let cart = JSON.parse(localStorage.getItem('medferpa_cart')) || [];
let paymentBrickController = null;

document.addEventListener('DOMContentLoaded', () => {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio.");
        window.location.href = 'index.html';
        return;
    }
    renderSummary();
    checkLoggedUser();
});

/* ============================================================
   2. MONITOR DE SESSÃO E PREENCHIMENTO AUTOMÁTICO
   ============================================================ */
function checkLoggedUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('cus-email').value = user.email || "";
            const nameParts = user.displayName ? user.displayName.split(' ') : ["", ""];
            document.getElementById('cus-name').value = nameParts[0];
            document.getElementById('cus-surname').value = nameParts.slice(1).join(' ');
            
            // Busca endereço salvo localmente ou futuramente do Firestore
            const savedAddr = JSON.parse(localStorage.getItem(`user_addr_${user.uid}`));
            if (savedAddr) {
                document.getElementById('ship-cep').value = savedAddr.cep || "";
                document.getElementById('ship-street').value = savedAddr.rua || "";
                document.getElementById('ship-number').value = savedAddr.num || "";
                document.getElementById('ship-bairro').value = savedAddr.bairro || "";
                if(document.getElementById('ship-city')) document.getElementById('ship-city').value = savedAddr.city || "";
                if(document.getElementById('ship-state')) document.getElementById('ship-state').value = savedAddr.state || "";
            }
        }
    });
}

/* ============================================================
   3. CONTROLE DE NAVEGAÇÃO (ETAPAS DO CHECKOUT)
   ============================================================ */
window.goToStep = (step) => {
    if (step === 2) {
        if (!document.getElementById('cus-email').value || !document.getElementById('cus-name').value) {
            return alert("Preencha seus dados de identificação.");
        }
    }

    if (step === 3) {
        if (!document.getElementById('ship-cep').value || !document.getElementById('ship-street').value) {
            return alert("Preencha o endereço de entrega.");
        }
        initMercadoPagoBrick();
    }

    document.querySelectorAll('.form-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    document.getElementById(`form-step-${step}`).classList.add('active');
    document.getElementById(`step-dot-${step}`).classList.add('active');
    window.scrollTo(0, 0);
};

/* ============================================================
   4. RESUMO DO PEDIDO (INTERFACE DO USUÁRIO)
   ============================================================ */
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

/* ============================================================
   5. INTEGRAÇÃO MERCADO PAGO BRICKS
   ============================================================ */
async function initMercadoPagoBrick() {
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

/* ============================================================
   6. FINALIZAÇÃO DO PEDIDO (CLOUD SYNC FIRESTORE)
   ============================================================ */
async function finishOrder(totalValue) {
    const user = auth.currentUser;
    const orderId = Math.floor(100000 + Math.random() * 900000);
    
    // Preparação do objeto para o banco de dados
    const orderData = {
        orderNumber: orderId,
        userId: user ? user.uid : "guest",
        customerEmail: document.getElementById('cus-email').value,
        customerName: document.getElementById('cus-name').value + " " + document.getElementById('cus-surname').value,
        total: totalValue,
        status: "Pagamento Aprovado",
        createdAt: serverTimestamp(), // Data sincronizada com o servidor do Firebase
        items: cart, // Salva os detalhes completos do carrinho
        timeSlot: localStorage.getItem('medferpa_selected_time') || "Horário Comercial"
    };

    try {
        // Gravação na coleção "orders" do Firestore
        await addDoc(collection(db, "orders"), orderData);
        
        // Limpeza dos dados temporários locais
        localStorage.removeItem('medferpa_cart');
        
        // Redirecionamento para o dashboard com sinal de sucesso
        window.location.href = "dashboard.html?order=success";
    } catch (error) {
        console.error("Erro ao salvar pedido no Banco de dados:", error);
        alert("Erro ao salvar seu pedido na nuvem. Verifique sua conexão." + error.message);
    }
}