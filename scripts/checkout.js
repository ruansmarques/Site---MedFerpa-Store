/**
 * LÓGICA DE CHECKOUT E PAGAMENTO REAL - MEDFERPA STORE
 * Versão: v.115 - CORREÇÃO DE CALLBACKS E INICIALIZAÇÃO
 * 
 * Descrição: Resolve erros de inicialização do Brick, restaura obrigatoriedade
 * de callbacks (onReady/onError) e corrige cálculos de subtotal no resumo.
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

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBgYUAagQzShLLAddybvinAYP17inZkYNg",
    authDomain: "medferpa-store-1cd4d.firebaseapp.com",
    projectId: "medferpa-store-1cd4d",
    storageBucket: "medferpa-store-1cd4d.firebasestorage.app",
    messagingSenderId: "902825986740",
    appId: "1:902825986740:web:f2c1f77ffba913a65ba5e1",
    measurementId: "G-YSPZM27EEK"
};

// Inicialização das ferramentas
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Chave Pública do Mercado Pago
const mp = new MercadoPago('APP_USR-786f2d55-857b-4ddf-9d4c-ff1d7a216ea4'); 
const bricksBuilder = mp.bricks();

// Variáveis de Controle Global
let cart = JSON.parse(localStorage.getItem('medferpa_cart')) || [];
let paymentBrickController = null;
let totalCompra = 0;

/* ============================================================
   2. INICIALIZAÇÃO DA PÁGINA
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Validação de segurança do carrinho
    if (!cart || cart.length === 0) {
        alert("Seu carrinho está vazio.");
        window.location.href = 'index.html';
        return;
    }
    
    renderSummary(); // Calcula valores e desenha o resumo
    checkLoggedUser(); // Monitora login para preenchimento
});

/* ============================================================
   3. MONITOR DE SESSÃO E PREENCHIMENTO AUTOMÁTICO
   ============================================================ */
function checkLoggedUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('cus-email').value = user.email || "";
            const nameParts = user.displayName ? user.displayName.split(' ') : ["", ""];
            document.getElementById('cus-name').value = nameParts[0];
            document.getElementById('cus-surname').value = nameParts.slice(1).join(' ');
        }
    });
}

/* ============================================================
   4. CONTROLE DE NAVEGAÇÃO (TRANSICÃO DE ETAPAS)
   ============================================================ */
window.goToStep = (step) => {
    // Validações antes de avançar para entrega
    if (step === 2) {
        const email = document.getElementById('cus-email').value;
        const name = document.getElementById('cus-name').value;
        const cpf = document.getElementById('cus-cpf').value;
        if (!email || !name || !cpf) return alert("Por favor, preencha todos os dados de identificação.");
    }

    // Validações antes de carregar o pagamento
    if (step === 3) {
        const cep = document.getElementById('ship-cep').value;
        const street = document.getElementById('ship-street').value;
        if (!cep || !street) return alert("Por favor, preencha o endereço de entrega.");
        
        // Inicializa o Brick somente na etapa 3
        initMercadoPagoBrick();
    }

    // Toggle visual de classes
    document.querySelectorAll('.form-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    document.getElementById(`form-step-${step}`).classList.add('active');
    document.getElementById(`step-dot-${step}`).classList.add('active');
    
    window.scrollTo(0, 0);
};

/* ============================================================
   5. RESUMO DO PEDIDO E CÁLCULOS TOTAIS
   ============================================================ */
function renderSummary() {
    const list = document.getElementById('summary-items-list');
    const subtotalEl = document.getElementById('sum-subtotal');
    const totalEl = document.getElementById('sum-total');
    
    totalCompra = 0;

    list.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        totalCompra += itemTotal;
        return `
            <div class="sum-item">
                <span>${item.quantity}x ${item.name} (${item.size})</span>
                <span>R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }).join('');

    const formatted = `R$ ${totalCompra.toFixed(2).replace('.', ',')}`;
    if (subtotalEl) subtotalEl.innerText = formatted;
    if (totalEl) totalEl.innerText = formatted;
}

/* ============================================================
   6. INTEGRAÇÃO MERCADO PAGO - PAYMENT BRICK (v.115)
   ============================================================ */
async function initMercadoPagoBrick() {
    // Proteção para não inicializar duas vezes o mesmo container
    if (paymentBrickController) return;

    const userEmail = document.getElementById('cus-email').value;
    const userName = document.getElementById('cus-name').value;
    const userSurname = document.getElementById('cus-surname').value;
    const userCPF = document.getElementById('cus-cpf').value.replace(/\D/g, '');

    const settings = {
        initialization: {
            amount: totalCompra,
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
                style: { theme: 'default' }
            }
        },
        callbacks: {
            //onReady é obrigatório
            onReady: () => {
                console.log("✅ Mercado Pago Brick carregado com sucesso.");
            },
            //onError é obrigatório (estava faltando e causava o erro undefined)
            onError: (error) => {
                console.error("❌ Erro no SDK do Mercado Pago:", error);
                alert("Houve um erro ao carregar os meios de pagamento. Tente recarregar a página.");
            },
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
                        // Trata retornos de sucesso ou pendência (Pix/Boleto)
                        if (result.status === "approved") {
                            processOrder(totalCompra, selectedPaymentMethod, "Pagamento Aprovado", resolve);
                        } 
                        else if (result.status === "pending" || result.status === "in_process") {
                            handlePendingPayment(result, selectedPaymentMethod, resolve);
                        } 
                        else {
                            alert("Pagamento não aprovado. Verifique os dados ou mude o meio de pagamento.");
                            reject();
                        }
                    })
                    .catch(error => {
                        console.error("Erro na API:", error);
                        alert("Erro de comunicação com o servidor de pagamentos.");
                        reject();
                    });
                });
            }
        },
    };

    paymentBrickController = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
}

/* ============================================================
   7. TRATAMENTO DE PIX / BOLETO (PENDENTE)
   ============================================================ */
function handlePendingPayment(result, method, resolve) {
    let instructionsHtml = "";

    // Lógica para PIX (Exibe QR Code)
    if (result.point_of_interaction?.transaction_data?.qr_code) {
        const qrCode = result.point_of_interaction.transaction_data.qr_code;
        const qrCodeBase64 = result.point_of_interaction.transaction_data.qr_code_base64;

        instructionsHtml = `
            <div style="text-align:center; padding: 30px; border: 2px dashed #1a73e8; border-radius: 12px; background: #f8faff;">
                <h3 style="color:#1a73e8; margin-bottom: 20px;">Finalize seu Pix</h3>
                <img src="data:image/png;base64,${qrCodeBase64}" style="width:220px; border: 10px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom:20px;">
                <p style="font-size:14px; color:#444; margin-bottom:15px;">Escaneie o código acima no app do seu banco.</p>
                <textarea readonly style="width:100%; height:70px; padding:10px; border:1px solid #ddd; border-radius:5px; font-size:11px; background:#fff; margin-bottom:15px; resize:none;">${qrCode}</textarea>
                <button onclick="navigator.clipboard.writeText('${qrCode}').then(() => alert('Copia e Cola copiado!'))" style="width:100%; background:#1a73e8; color:#fff; padding:15px; border:none; border-radius:8px; font-weight:800; cursor:pointer;">COPIAR CÓDIGO PIX</button>
                <p style="margin-top:20px; font-size:12px; color:#666;">Seu pedido será liberado imediatamente após a confirmação.</p>
            </div>
        `;
    } 
    // Lógica para BOLETO (Exibe link)
    else if (result.transaction_details?.external_resource_url) {
        const urlBoleto = result.transaction_details.external_resource_url;
        instructionsHtml = `
            <div style="text-align:center; padding: 30px; border: 2px dashed #000; border-radius: 12px; background: #fff;">
                <h3 style="margin-bottom: 20px;">Boleto Gerado!</h3>
                <p style="margin-bottom: 25px;">Clique no botão abaixo para acessar o seu boleto bancário.</p>
                <a href="${urlBoleto}" target="_blank" style="display:block; background:#000; color:#fff; padding:18px; text-decoration:none; border-radius:8px; font-weight:800; text-transform:uppercase;">ABRIR BOLETO BANCÁRIO</a>
            </div>
        `;
    }

    // Injeta as instruções no container do formulário
    document.getElementById('paymentBrick_container').innerHTML = instructionsHtml;
    
    // Salva o pedido no banco como aguardando
    processOrder(totalCompra, method, "Aguardando Pagamento", resolve);
}

/* ============================================================
   8. SALVAMENTO DO PEDIDO (FIRESTORE)
   ============================================================ */
async function processOrder(totalValue, method, statusLabel, resolve) {
    const user = auth.currentUser;
    const orderNumber = Math.floor(100000 + Math.random() * 900000);

    const orderData = {
        orderNumber: orderNumber,
        userId: user ? user.uid : "guest",
        customerName: (document.getElementById('cus-name').value + " " + document.getElementById('cus-surname').value).toUpperCase(),
        customerEmail: document.getElementById('cus-email').value,
        total: totalValue,
        paymentMethod: method,
        status: statusLabel, 
        createdAt: serverTimestamp(),
        items: cart,
        delivery: {
            rua: document.getElementById('ship-street').value,
            num: document.getElementById('ship-number').value,
            bairro: document.getElementById('ship-bairro').value,
            cep: document.getElementById('ship-cep').value
        }
    };

    try {
        await addDoc(collection(db, "orders"), orderData);
        localStorage.removeItem('medferpa_cart');
        resolve(); // Conclui a animação de carregamento do botão do Mercado Pago
        
        // Se for cartão (aprovado na hora), redireciona direto
        if (statusLabel === "Pagamento Aprovado") {
            alert("Pagamento Aprovado! Você será redirecionado.");
            window.location.href = "dashboard.html";
        }
    } catch (e) {
        console.error("Erro ao salvar pedido:", e);
    }
}