/**
 * SISTEMA DE AUTENTICAÇÃO E GESTÃO DE DADOS - MEDFERPA STORE
 * Versão: v.108 - Gestão de Pedidos e Histórico
 * 
 * Integração: Firebase Auth + Firestore
 * Funcionalidade: Login, Cadastro, Perfil e Controle de Histórico de Pedidos.
 */

/* ============================================================
   1. IMPORTAÇÕES (TODAS NO TOPO)
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged, 
    updateProfile, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ============================================================
   2. CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
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
const googleProvider = new GoogleAuthProvider();

let isLoginMode = true;

/* ============================================================
   3. MONITOR DE SESSÃO (HEADER E DASHBOARD)
   ============================================================ */
onAuthStateChanged(auth, async (user) => {
    const userIcon = document.getElementById('user-icon-header');
    const userLink = document.getElementById('user-link-header');
    
    if (user) {
        if (userLink) userLink.href = "dashboard.html";
        if (userIcon) {
            userIcon.src = user.photoURL || "assets/icon-user.svg";
            userIcon.style.borderRadius = "50%";
            userIcon.style.border = "2px solid #000";
        }

        if (window.location.pathname.includes('dashboard.html')) {
            loadUserData(user);
            renderUserOrders(user);
        }
    } else {
        if (userLink) userLink.href = "login.html";
        if (userIcon) userIcon.src = "assets/icon-user.svg";

        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "login.html";
        }
    }
});

/* ============================================================
   4. GESTÃO DE DADOS DO USUÁRIO (PERFIL E ENDEREÇO)
   ============================================================ */
async function loadUserData(user) {
    const dashName = document.getElementById('dash-user-name');
    const dashEmail = document.getElementById('dash-user-email');
    const dashImg = document.getElementById('dash-user-img');
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');

    if (dashName) dashName.innerText = user.displayName || user.email.split('@')[0];
    if (dashEmail) dashEmail.innerText = user.email;
    if (dashImg && user.photoURL) dashImg.src = user.photoURL;
    if (editName) editName.value = user.displayName || "";
    if (editEmail) editEmail.value = user.email;

    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (document.getElementById('edit-gender')) document.getElementById('edit-gender').value = data.gender || "não informado";
            if (document.getElementById('edit-phone')) document.getElementById('edit-phone').value = data.phone || "";
            if (document.getElementById('addr-cep')) document.getElementById('addr-cep').value = data.address?.cep || "";
            if (document.getElementById('addr-bairro')) document.getElementById('addr-bairro').value = data.address?.bairro || "";
            if (document.getElementById('addr-rua')) document.getElementById('addr-rua').value = data.address?.rua || "";
            if (document.getElementById('addr-num')) document.getElementById('addr-num').value = data.address?.num || "";
            if (document.getElementById('addr-comp')) document.getElementById('addr-comp').value = data.address?.comp || "";
        }
    } catch (e) { console.error("Erro Firestore:", e); }
}

document.getElementById('save-profile')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert("Você precisa estar logado!");

    const name = document.getElementById('edit-name').value;
    const gender = document.getElementById('edit-gender').value;
    const phone = document.getElementById('edit-phone').value;

    try {
        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, "users", user.uid), { name, gender, phone }, { merge: true });
        alert("Perfil atualizado!");
        location.reload();
    } catch (e) { alert("Erro ao salvar perfil."); }
});

document.getElementById('save-address')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    const address = {
        cep: document.getElementById('addr-cep').value,
        bairro: document.getElementById('addr-bairro').value,
        rua: document.getElementById('addr-rua').value,
        num: document.getElementById('addr-num').value,
        comp: document.getElementById('addr-comp').value
    };

    try {
        await setDoc(doc(db, "users", user.uid), { address }, { merge: true });
        alert("Endereço sincronizado!");
        location.reload();
    } catch (e) { alert("Erro ao salvar endereço."); }
});

/* ============================================================
   5. GESTÃO DE PEDIDOS E HISTÓRICO
   ============================================================ */
async function renderUserOrders(user) {
    const activeContainer = document.getElementById('active-orders-container');
    const historyContainer = document.getElementById('history-orders-container');
    
    if (!activeContainer || !historyContainer) return;

    try {
        console.log("Buscando pedidos para o usuário:", user.uid);
        
        // Consulta ao Firestore
        const q = query(
            collection(db, "orders"), 
            where("userId", "==", user.uid), 
            orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("Nenhum pedido encontrado no banco.");
            activeContainer.innerHTML = `<p class="empty-msg">Suas compras para ser entregues aparecerão aqui.</p>`;
            historyContainer.innerHTML = `<p class="empty-msg">Você ainda não possui histórico de compras.</p>`;
            return;
        }

        let activeHtml = "";
        let historyHtml = "";

        snapshot.docs.forEach(docSnap => {
            const o = docSnap.data();
            const orderId = docSnap.id;
            
            // Tratamento de segurança para data e itens
            const date = o.createdAt ? o.createdAt.toDate().toLocaleDateString('pt-BR') : "Processando...";
            const itemsList = o.items && Array.isArray(o.items) 
                ? o.items.map(i => `${i.quantity}x ${i.name}`).join(', ') 
                : "Itens não identificados";
            
            const cardTemplate = `
                <div class="order-card-item">
                    <div class="order-card-header">
                        <strong>Pedido #${o.orderNumber || '---'}</strong>
                        <span class="status-badge ${o.status === 'Entregue' ? 'status-delivered' : 'status-pending'}">${o.status}</span>
                    </div>
                    <div class="order-card-body">
                        <p><strong>Data:</strong> ${date}</p>
                        <p><strong>Total:</strong> R$ ${o.total ? o.total.toFixed(2).replace('.', ',') : '0,00'}</p>
                        <p class="order-items-list" style="color: #666; font-size: 12px; margin-top: 8px;">${itemsList}</p>
                    </div>
                    ${o.status !== 'Entregue' ? 
                        `<button class="btn-confirm-delivery" onclick="confirmDelivery('${orderId}')">Já recebi meu pedido</button>` : 
                        `<div class="order-check-icon" style="color:green; font-weight:bold; margin-top:10px; font-size: 13px;">✓ Pedido Entregue</div>`
                    }
                </div>
            `;

            if (o.status === "Entregue") historyHtml += cardTemplate;
            else activeHtml += cardTemplate;
        });

        activeContainer.innerHTML = activeHtml || `<p class="empty-msg">Suas compras para ser entregues aparecerão aqui.</p>`;
        historyContainer.innerHTML = historyHtml || `<p class="empty-msg">Nenhum pedido finalizado ainda.</p>`;

    } catch (e) { 
        console.error("Erro crítico ao carregar pedidos:", e);
        // Se o erro no console disser "The query requires an index", você DEVE clicar no link que o Firebase fornece.
    }
}

window.confirmDelivery = async (docId) => {
    if (!confirm("Confirmar o recebimento deste pedido?")) return;
    try {
        await updateDoc(doc(db, "orders", docId), { status: "Entregue" });
        alert("Pedido movido para o histórico!");
        location.reload();
    } catch (e) { alert("Erro ao atualizar status."); }
};

/* ============================================================
   6. AUTENTICAÇÃO (LOGIN E CADASTRO)
   ============================================================ */
window.loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        window.location.href = "dashboard.html";
    } catch (e) { console.error(e); }
};

const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('user-email').value;
        const pass = document.getElementById('user-password').value;
        const btn = document.getElementById('btn-auth-main');

        btn.disabled = true;
        btn.innerText = "Aguarde...";

        try {
            if (isLoginMode) await signInWithEmailAndPassword(auth, email, pass);
            else await createUserWithEmailAndPassword(auth, email, pass);
            window.location.href = "dashboard.html";
        } catch (err) {
            alert("Erro: " + err.code);
            btn.disabled = false;
            btn.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
        }
    });
}

window.logoutUser = () => signOut(auth).then(() => window.location.href = "index.html");

/* ============================================================
   7. INTERFACE E MODAIS
   ============================================================ */
window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('btn-auth-main');
    const switchBtn = document.getElementById('switch-to-signup');

    title.innerText = isLoginMode ? "Fazer login" : "Criar conta";
    btn.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
    switchBtn.innerText = isLoginMode ? "Cadastre-se aqui" : "Voltar para Login";
};

// Máscara de telefone
const phoneInput = document.getElementById('edit-phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
}

window.openModal = (type) => {
    const modal = document.getElementById('policy-modal');
    const text = document.getElementById('modal-text');
    const content = {
        privacy: `<h2>Privacidade</h2><p>Protegemos seus dados conforme a LGPD.</p>`,
        terms: `<h2>Termos</h2><p>Uso exclusivo MedFerpa Store.</p>`
    };
    if (text) text.innerHTML = content[type];
    if (modal) modal.style.display = 'flex';
};

window.closeModal = () => document.getElementById('policy-modal').style.display = 'none';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-logout-dash')?.addEventListener('click', window.logoutUser);
    document.getElementById('btn-google-login')?.addEventListener('click', window.loginWithGoogle);
    document.getElementById('switch-to-signup')?.addEventListener('click', window.toggleAuthMode);
    document.getElementById('open-privacy')?.addEventListener('click', () => window.openModal('privacy'));
    document.getElementById('open-terms')?.addEventListener('click', () => window.openModal('terms'));
    document.getElementById('close-modal')?.addEventListener('click', window.closeModal);
    window.addEventListener('click', (e) => { if (e.target.id === 'policy-modal') window.closeModal(); });
});