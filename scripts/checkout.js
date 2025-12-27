import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. CONFIGURAÇÃO FIREBASE
const firebaseConfig = { apiKey: "AIzaSyBgYUAagQzShLLAddybvinAYP17inZkYNg", authDomain: "medferpa-store-1cd4d.firebaseapp.com", projectId: "medferpa-store-1cd4d" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 2. CONFIGURAÇÃO MERCADO PAGO
const mp = new MercadoPago('APP_USR-7090875e-8557-41ec-9602-0e5445657805'); // SUBSTITUA PELA SUA PUBLIC KEY
const bricksBuilder = mp.bricks();

let cart = JSON.parse(localStorage.getItem('medferpa_cart')) || [];
let currentStep = 1;

document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    checkLoggedUser();
});

// --- CONTROLE DE ETAPAS ---
window.goToStep = (step) => {
    // Validação básica para avançar
    if (step === 2 && !document.getElementById('cus-email').value) return alert("Preencha seus dados de identificação.");
    if (step === 3) initMercadoPagoBrick(); // Inicializa o MP só quando chegar na etapa 3

    document.querySelectorAll('.form-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    document.getElementById(`form-step-${step}`).classList.add('active');
    document.getElementById(`step-dot-${step}`).classList.add('active');
    
    window.scrollTo(0,0);
};

// --- RECUPERAÇÃO DE DADOS DO USUÁRIO ---
function checkLoggedUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Preenche etapa 1
            document.getElementById('cus-email').value = user.email;
            document.getElementById('cus-name').value = user.displayName?.split(' ')[0] || "";
            document.getElementById('cus-surname').value = user.displayName?.split(' ').slice(1).join(' ') || "";
            
            // Tenta recuperar endereço salvo no LocalStorage do Dashboard (Etapa 2 anterior)
            // Se você salvou no dashboard com IDs específicos, buscamos aqui
            const savedAddr = JSON.parse(localStorage.getItem('user_address_info'));
            if(savedAddr) {
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

// --- RESUMO DO PEDIDO ---
function renderSummary() {
    const list = document.getElementById('summary-items-list');
    let total = 0;
    list.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `<div class="sum-item"><span>${item.quantity}x ${item.name}</span><span>R$ ${(item.price * item.quantity).toFixed(2)}</span></div>`;
    }).join('');
    document.getElementById('sum-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// --- INICIALIZAÇÃO MERCADO PAGO BRICK ---
async function initMercadoPagoBrick() {
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    const settings = {
        initialization: {
            amount: totalAmount,
            payer: {
                email: document.getElementById('cus-email').value,
            },
        },
        customization: {
            paymentMethods: {
                ticket: "all",
                bankTransfer: "all",
                creditCard: "all",
                maxInstallments: 12
            },
        },
        callbacks: {
            onReady: () => {
                console.log("Brick Pronto");
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                // Aqui você enviaria os dados para o seu BACKEND processar
                console.log("Dados do Pagamento:", formData);
                return new Promise((resolve, reject) => {
                    // Simulação de sucesso para este projeto frontend
                    alert("Pagamento processado com sucesso (Simulação)!");
                    finishOrder(); 
                    resolve();
                });
            },
            onError: (error) => {
                console.error(error);
            },
        },
    };
    window.paymentBrickController = await bricksBuilder.create(
        'payment',
        'paymentBrick_container',
        settings
    );
}

function finishOrder() {
    // Mesma lógica de salvar no Dashboard que fizemos antes
    localStorage.removeItem('medferpa_cart');
    window.location.href = "dashboard.html";
}