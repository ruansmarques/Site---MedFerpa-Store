/**
 * LÓGICA DE CHECKOUT E PAGAMENTO REAL - MEDFERPA STORE
 * Versão: v.111 - CONEXÃO COM API REAL (FIREBASE FUNCTIONS)
 */

/* ============================================================
   1. IMPORTAÇÕES E CONFIGURAÇÕES INICIAIS
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp,
    doc,
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

/* ============================================================
   2. INICIALIZAÇÃO DA PÁGINA
   ============================================================ */
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
   3. MONITOR DE SESSÃO E RECUPERAÇÃO DE DADOS
   ============================================================ */
function checkLoggedUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('cus-email').value = user.email || "";
            const nameParts = user.displayName ? user.displayName.split(' ') : ["", ""];
            document.getElementById('cus-name').value = nameParts[0];
            document.getElementById('cus-surname').value = nameParts.slice(1).join(' ');
            
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
   4. CONTROLE DE NAVEGAÇÃO ENTRE ETAPAS
   ============================================================ */
window.goToStep = (step) => {
    if (step === 2) {
        const email = document.getElementById('cus-email').value;
        const name = document.getElementById('cus-name').value;
        if (!email || !name) return alert("Por favor, preencha seus dados de identificação.");
    }

    if (step === 3) {
        const cep = document.getElementById('ship-cep').value;
        const street = document.getElementById('ship-street').value;
        const num = document.getElementById('ship-number').value;
        if (!cep || !street || !num) return alert("Por favor, preencha o endereço de entrega completo.");
        initMercadoPagoBrick();
    }

    document.querySelectorAll('.form-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`form-step-${step}`).classList.add('active');
    document.getElementById(`step-dot-${step}`).classList.add('active');
    window.scrollTo(0, 0);
};

/* ============================================================
   5. RESUMO DO PEDIDO LADO DIREITO
   ============================================================ */
function renderSummary() {
    const list = document.getElementById('summary-items-list');
    let total = 0;
    list.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="sum-item">
                <span style="font-size: 13px;">${item.quantity}x ${item.name} (${item.size})</span>
                <span style="font-weight: 700;">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }).join('');
    const formattedTotal = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('sum-subtotal').innerText = formattedTotal;
    document.getElementById('sum-total').innerText = formattedTotal;
}

/* ============================================================
   6. INTEGRAÇÃO MERCADO PAGO - CONEXÃO COM A API REAL
   ============================================================ */
async function initMercadoPagoBrick() {
    if (paymentBrickController) return;

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const userEmail = document.getElementById('cus-email').value;

    const settings = {
        initialization: {
            amount: totalAmount,
            payer: {
                email: userEmail,
                firstName: document.getElementById('cus-name').value,
                lastName: document.getElementById('cus-surname').value,
            },
        },
        customization: {
            paymentMethods: {
                creditCard: "all",
                ticket: "all",
                bankTransfer: "all",
                maxInstallments: 12
            },
            visual: {
                style: { theme: 'default' },
                texts: { paymentsTitle: 'Meio de pagamento', payButton: 'Pagar Agora' }
            }
        },
        callbacks: {
            onReady: () => console.log("Payment Brick pronto."),
            
            // BLOCO ALTERADO: Agora envia os dados para a sua API no Firebase Functions
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                return new Promise((resolve, reject) => {
                    // SUA URL DO FIREBASE FUNCTIONS
                    const functionUrl = "https://us-central1-medferpa-store-1cd4d.cloudfunctions.net/processPayment";

                    fetch(functionUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(formData),
                    })
                    .then(response => response.json())
                    .then(result => {
                        // Se o status for 'approved' (Aprovado), salvamos o pedido no banco
                        if (result.status === "approved") {
                            processOrder(totalAmount, selectedPaymentMethod, resolve, reject);
                        } else {
                            alert("Pagamento não aprovado. Status: " + (result.status_detail || result.status));
                            reject();
                        }
                    })
                    .catch(error => {
                        console.error("Erro na chamada da API:", error);
                        alert("Ocorreu um erro ao processar o pagamento com o servidor.");
                        reject();
                    });
                });
            },
            onError: (error) => {
                console.error("Erro no Brick:", error);
                alert("Erro ao carregar o sistema de pagamento.");
            },
        },
    };

    paymentBrickController = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
}

/* ============================================================
   7. FINALIZAÇÃO DO PEDIDO (SALVAR NO BANCO DE DADOS)
   ============================================================ */
async function processOrder(totalValue, method, resolve, reject) {
    const user = auth.currentUser;
    const orderNumber = Math.floor(100000 + Math.random() * 900000);

    const orderData = {
        orderNumber: orderNumber,
        userId: user ? user.uid : "guest",
        customerName: document.getElementById('cus-name').value + " " + document.getElementById('cus-surname').value,
        customerEmail: document.getElementById('cus-email').value,
        total: totalValue,
        paymentMethod: method,
        status: "Pagamento Aprovado", 
        createdAt: serverTimestamp(),
        items: cart,
        deliveryDetails: {
            cep: document.getElementById('ship-cep').value,
            rua: document.getElementById('ship-street').value,
            numero: document.getElementById('ship-number').value,
            bairro: document.getElementById('ship-bairro').value,
            complemento: document.getElementById('ship-comp').value || "N/A"
        },
        timeSlot: localStorage.getItem('medferpa_selected_time') || "Horário Comercial"
    };

    try {
        await addDoc(collection(db, "orders"), orderData);
        localStorage.removeItem('medferpa_cart');
        resolve(); // Notifica o Mercado Pago Brick do sucesso
        alert(`Pedido #${orderNumber} realizado com sucesso!`);
        window.location.href = "dashboard.html?status=success";
    } catch (error) {
        console.error("Erro ao salvar pedido:", error);
        alert("Erro ao registrar o pedido no banco de dados.");
        reject();
    }
}