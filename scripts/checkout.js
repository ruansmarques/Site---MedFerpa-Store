/**
 * LÓGICA DE CHECKOUT E PAGAMENTO REAL - MEDFERPA STORE
 * Versão: v.113 - ESTABILIZAÇÃO DE TOTAIS E BOTÕES
 * 
 * Descrição: Corrige o bug de valor R$ 0,00 e restaura a funcionalidade
 * do botão de finalizar pagamento com integração ao Firebase.
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
    serverTimestamp 
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

// Estado Global
let cart = JSON.parse(localStorage.getItem('medferpa_cart')) || [];
let paymentBrickController = null;
let totalCompra = 0; // Variável global para armazenar o valor exato da compra

/* ============================================================
   2. INICIALIZAÇÃO DA PÁGINA
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Redireciona se o carrinho estiver vazio ou se houver erro nos dados
    if (!cart || cart.length === 0) {
        alert("Seu carrinho está vazio ou os dados são inválidos.");
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
            
            // Busca endereço do LocalStorage vinculado ao UID
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
        const cpf = document.getElementById('cus-cpf').value;
        if (!email || !name || !cpf) return alert("Por favor, preencha seus dados de identificação.");
    }

    if (step === 3) {
        const cep = document.getElementById('ship-cep').value;
        const street = document.getElementById('ship-street').value;
        const num = document.getElementById('ship-number').value;
        if (!cep || !street || !num) return alert("Preencha o endereço de entrega completo.");
        
        // Garante que o totalCompra esteja atualizado antes de abrir o pagamento
        if (totalCompra <= 0) return alert("Erro ao calcular o valor da compra. Recarregue a página.");
        
        initMercadoPagoBrick();
    }

    document.querySelectorAll('.form-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    document.getElementById(`form-step-${step}`).classList.add('active');
    document.getElementById(`step-dot-${step}`).classList.add('active');
    window.scrollTo(0, 0);
};

/* ============================================================
   5. RESUMO DO PEDIDO E CÁLCULO DE VALORES
   ============================================================ */
function renderSummary() {
    const list = document.getElementById('summary-items-list');
    totalCompra = 0; // Reseta para calcular de novo

    list.innerHTML = cart.map(item => {
        // Garante que o preço e quantidade sejam tratados como números
        const preco = Number(item.price);
        const qtd = Number(item.quantity);
        const itemTotal = preco * qtd;
        totalCompra += itemTotal;

        return `
            <div class="sum-item">
                <span style="font-size: 13px;">${qtd}x ${item.name} (${item.size})</span>
                <span style="font-weight: 700;">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }).join('');

    const formattedTotal = `R$ ${totalCompra.toFixed(2).replace('.', ',')}`;
    document.getElementById('sum-subtotal').innerText = formattedTotal;
    document.getElementById('sum-total').innerText = formattedTotal;
}

/* ============================================================
   6. INTEGRAÇÃO MERCADO PAGO - PAYMENT BRICK (CONEXÃO API REAL)
   ============================================================ */
async function initMercadoPagoBrick() {
    if (paymentBrickController) return;

    const userEmail = document.getElementById('cus-email').value;
    const userName = document.getElementById('cus-name').value;
    const userSurname = document.getElementById('cus-surname').value;
    const userCPF = document.getElementById('cus-cpf').value.replace(/\D/g, '');

    const settings = {
        initialization: {
            amount: totalCompra, // Valor exato calculado no renderSummary
            payer: {
                email: userEmail,
                firstName: userName,
                lastName: userSurname,
                identification: { type: 'CPF', number: userCPF }
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
            }
        },
        callbacks: {
            onReady: () => console.log("Bricks carregado com o total: R$", totalCompra),
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                return new Promise((resolve, reject) => {
                    const functionUrl = "https://us-central1-medferpa-store-1cd4d.cloudfunctions.net/processPayment";

                    fetch(functionUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(formData),
                    })
                    .then(response => response.json())
                    .then(result => {
                        // Aceita status de aprovado ou pendente (Pix/Boleto)
                        if (result.status === "approved" || result.status === "in_process" || result.status === "pending") {
                            // Envia os dados para salvar no Firebase e passa o resolve/reject do botão
                            processOrder(totalCompra, selectedPaymentMethod, resolve, reject);
                        } else {
                            alert("Pagamento recusado: " + (result.status_detail || result.status));
                            reject();
                        }
                    })
                    .catch(error => {
                        console.error("Erro na API:", error);
                        alert("Erro de comunicação com o servidor de pagamentos.");
                        reject();
                    });
                });
            },
            onError: (error) => console.error("Erro no Brick:", error),
        },
    };

    paymentBrickController = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
}

/* ============================================================
   7. PROCESSAMENTO E SALVAMENTO DO PEDIDO NO BANCO
   ============================================================ */
async function processOrder(totalValue, method, resolve, reject) {
    const user = auth.currentUser;
    const orderNumber = Math.floor(100000 + Math.random() * 900000);

    const orderData = {
        orderNumber: orderNumber,
        userId: user ? user.uid : "guest",
        customerName: (document.getElementById('cus-name').value + " " + document.getElementById('cus-surname').value).toUpperCase(),
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
        }
    };

    try {
        console.log("Tentando salvar pedido no Firebase...");
        const docRef = await addDoc(collection(db, "orders"), orderData);
        console.log("Pedido salvo com ID:", docRef.id);
        
        localStorage.removeItem('medferpa_cart');
        resolve(); // Finaliza animação do botão

        alert(`Sucesso! Pedido #${orderNumber} realizado.`);
        window.location.href = "dashboard.html?status=success";

    } catch (error) {
        console.error("ERRO FIREBASE DETALHADO:", error);
        alert("O pagamento foi aprovado, mas houve um erro de permissão ao salvar no banco. Verifique as 'Rules' do Firestore.");
        reject(); 
    }
}