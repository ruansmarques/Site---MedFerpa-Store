/**
 * LÓGICA DE CHECKOUT E PAGAMENTO REAL - MEDFERPA STORE
 * Versão: v.114 - FLUXO DE PAGAMENTO ASSÍNCRONO (PIX/BOLETO)
 */

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

let cart = JSON.parse(localStorage.getItem('medferpa_cart')) || [];
let paymentBrickController = null;
let totalCompra = 0;

/* ============================================================
   2. INICIALIZAÇÃO E MONITORAMENTO
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    if (!cart || cart.length === 0) {
        window.location.href = 'index.html';
        return;
    }
    renderSummary();
    checkLoggedUser();
});

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
   3. NAVEGAÇÃO ENTRE ETAPAS
   ============================================================ */
window.goToStep = (step) => {
    if (step === 2) {
        if (!document.getElementById('cus-email').value || !document.getElementById('cus-name').value || !document.getElementById('cus-cpf').value) {
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
   4. RESUMO DO PEDIDO
   ============================================================ */
function renderSummary() {
    const list = document.getElementById('summary-items-list');
    totalCompra = 0;
    list.innerHTML = cart.map(item => {
        totalCompra += (item.price * item.quantity);
        return `<div class="sum-item"><span>${item.quantity}x ${item.name}</span><span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span></div>`;
    }).join('');
    document.getElementById('sum-total').innerText = `R$ ${totalCompra.toFixed(2).replace('.', ',')}`;
}

/* ============================================================
   5. INTEGRAÇÃO MERCADO PAGO - PAYMENT BRICK v.114
   ============================================================ */
async function initMercadoPagoBrick() {
    if (paymentBrickController) return;

    const settings = {
        initialization: {
            amount: totalCompra,
            payer: {
                email: document.getElementById('cus-email').value,
                firstName: document.getElementById('cus-name').value,
                lastName: document.getElementById('cus-surname').value,
                identification: { type: 'CPF', number: document.getElementById('cus-cpf').value.replace(/\D/g, '') }
            },
        },
        customization: {
            paymentMethods: { creditCard: "all", ticket: "all", bankTransfer: "all" },
            visual: { style: { theme: 'default' } }
        },
        callbacks: {
            onReady: () => console.log("Sistema de pagamento pronto."),
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
                        // LÓGICA DE SUCESSO REAL
                        if (result.status === "approved") {
                            processOrder(totalCompra, selectedPaymentMethod, "Pagamento Aprovado", resolve);
                        } 
                        else if (result.status === "pending" || result.status === "in_process") {
                            // Se for Pix ou Boleto, exibe instruções e salva como pendente
                            handlePendingPayment(result, selectedPaymentMethod, resolve);
                        } 
                        else {
                            alert("Pagamento recusado.");
                            reject();
                        }
                    })
                    .catch(e => { reject(); });
                });
            }
        },
    };
    paymentBrickController = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
}

/* ============================================================
   6. TRATAMENTO DE PIX / BOLETO (PENDENTE)
   ============================================================ */
function handlePendingPayment(result, method, resolve) {
    let instructionsHtml = "";

    // Se for PIX
    if (result.point_of_interaction?.transaction_data?.qr_code) {
        const qrCode = result.point_of_interaction.transaction_data.qr_code;
        const qrCodeBase64 = result.point_of_interaction.transaction_data.qr_code_base64;

        instructionsHtml = `
            <div style="text-align:center; padding: 20px; border: 2px dashed #000; border-radius: 10px; background: #fff;">
                <h3 style="margin-bottom: 15px;">Pague com Pix</h3>
                <img src="data:image/png;base64,${qrCodeBase64}" style="width:200px; margin-bottom:15px;">
                <p style="font-size:12px; color:#666; margin-bottom:10px;">Escaneie o QR Code ou copie a chave abaixo:</p>
                <textarea readonly style="width:100%; height:60px; font-size:10px; margin-bottom:15px;">${qrCode}</textarea>
                <button onclick="navigator.clipboard.writeText('${qrCode}').then(() => alert('Copiado!'))" style="background:#000; color:#fff; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">COPIAR CHAVE PIX</button>
                <p style="margin-top:20px; font-weight:800; color: #d33;">Atenção: O pedido será aprovado após o pagamento.</p>
            </div>
        `;
    } 
    // Se for BOLETO
    else if (result.transaction_details?.external_resource_url) {
        const urlBoleto = result.transaction_details.external_resource_url;
        instructionsHtml = `
            <div style="text-align:center; padding: 20px; border: 2px dashed #000; border-radius: 10px; background: #fff;">
                <h3>Seu Boleto foi gerado!</h3>
                <p style="margin: 15px 0;">Clique no botão abaixo para baixar ou pagar o boleto.</p>
                <a href="${urlBoleto}" target="_blank" style="display:inline-block; background:#000; color:#fff; padding:15px 30px; text-decoration:none; border-radius:5px; font-weight:800;">ABRIR BOLETO</a>
            </div>
        `;
    }

    // Substitui o formulário pelas instruções
    document.getElementById('paymentBrick_container').innerHTML = instructionsHtml;
    
    // Salva no banco como "Aguardando Pagamento"
    processOrder(totalCompra, method, "Aguardando Pagamento", resolve);
}

/* ============================================================
   7. FINALIZAÇÃO DO PEDIDO (BANCO DE DADOS)
   ============================================================ */
async function processOrder(totalValue, method, statusLabel, resolve) {
    const user = auth.currentUser;
    const orderData = {
        orderNumber: Math.floor(100000 + Math.random() * 900000),
        userId: user ? user.uid : "guest",
        customerName: document.getElementById('cus-name').value.toUpperCase(),
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
        resolve(); // Fecha o estado de loading do botão
        
        // Se for cartão (aprovado na hora), já redireciona. 
        // Se for Pix, o usuário verá o QR Code e decidirá quando sair.
        if (statusLabel === "Pagamento Aprovado") {
            alert("Pagamento Aprovado com Sucesso!");
            window.location.href = "dashboard.html";
        }
    } catch (e) { console.error(e); }
}