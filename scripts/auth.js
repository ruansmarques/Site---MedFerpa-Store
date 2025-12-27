/**
 * SISTEMA DE AUTENTICAÇÃO E GESTÃO DE DADOS - MEDFERPA STORE
 * Versão: v.107 - Cloud Sync Final
 * 
 * Integração: Firebase Auth + Firestore (Banco de Dados)
 * Funcionalidade: Login, Cadastro e Sincronização de Perfil/Pedidos na Nuvem.
 */

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

// Importações do Firestore para persistência definitiva
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ============================================================
   1. CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
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
   2. MONITOR DE SESSÃO (SINCRONIZAÇÃO DE HEADER E ACESSO)
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

        // Se estiver no Dashboard, carrega dados do Firestore
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
   3. GESTÃO DE DADOS DO USUÁRIO (PERFIL E ENDEREÇO NO FIRESTORE)
   ============================================================ */
async function loadUserData(user) {
    const dashName = document.getElementById('dash-user-name');
    const dashEmail = document.getElementById('dash-user-email');
    const dashImg = document.getElementById('dash-user-img');
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');

    // Preenchimento básico
    if (dashName) dashName.innerText = user.displayName || user.email.split('@')[0];
    if (dashEmail) dashEmail.innerText = user.email;
    if (dashImg && user.photoURL) dashImg.src = user.photoURL;
    if (editName) editName.value = user.displayName || "";
    if (editEmail) editEmail.value = user.email;

    // Busca dados complementares no Banco de Dados Cloud
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Perfil
            if (document.getElementById('edit-gender')) document.getElementById('edit-gender').value = data.gender || "não informado";
            if (document.getElementById('edit-phone')) document.getElementById('edit-phone').value = data.phone || "";
            // Endereço
            if (document.getElementById('addr-cep')) document.getElementById('addr-cep').value = data.address?.cep || "";
            if (document.getElementById('addr-bairro')) document.getElementById('addr-bairro').value = data.address?.bairro || "";
            if (document.getElementById('addr-rua')) document.getElementById('addr-rua').value = data.address?.rua || "";
            if (document.getElementById('addr-num')) document.getElementById('addr-num').value = data.address?.num || "";
            if (document.getElementById('addr-comp')) document.getElementById('addr-comp').value = data.address?.comp || "";
        }
    } catch (e) { console.error("Erro ao ler Firestore:", e); }
}

// Salvar Perfil no Firebase
document.getElementById('save-profile')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    const name = document.getElementById('edit-name').value;
    const gender = document.getElementById('edit-gender').value;
    const phone = document.getElementById('edit-phone').value;

    try {
        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, "users", user.uid), { name, gender, phone }, { merge: true });
        alert("Perfil atualizado na nuvem!");
        location.reload();
    } catch (e) { alert("Erro ao salvar perfil."); }
});

// Salvar Endereço no Firebase
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

// Renderizar Pedidos do Firestore
async function renderUserOrders(user) {
    const container = document.getElementById('active-orders-container');
    if (!container) return;

    try {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = `<p class="empty-msg">Nenhum pedido realizado.</p>`;
            return;
        }

        container.innerHTML = snapshot.docs.map(doc => {
            const o = doc.data();
            const date = o.createdAt?.toDate().toLocaleDateString('pt-BR') || "Processando...";
            return `
                <div class="order-card-item" style="border: 1px solid #eee; padding: 20px; border-radius: 12px; margin-bottom: 15px; background: #fff;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong style="color:#000;">Pedido #${o.orderNumber}</strong>
                        <span style="font-size:11px; background:#e8f0fe; padding:4px 10px; border-radius:10px;">${o.status}</span>
                    </div>
                    <p style="font-size:13px; margin-top:10px;">Data: ${date} | Total: R$ ${o.total.toFixed(2).replace('.', ',')}</p>
                </div>
            `;
        }).join('');
    } catch (e) { console.error("Erro pedidos:", e); }
}

/* ============================================================
   4. AUTENTICAÇÃO (LOGIN, CADASTRO E SOCIAL)
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
        btn.innerText = "Processando...";

        try {
            if (isLoginMode) await signInWithEmailAndPassword(auth, email, pass);
            else await createUserWithEmailAndPassword(auth, email, pass);
            window.location.href = "dashboard.html";
        } catch (err) {
            alert("Erro: " + err.code);
            btn.disabled = false;
        }
    });
}

window.logoutUser = () => signOut(auth).then(() => window.location.href = "index.html");

/* ============================================================
   5. MODAIS E MÁSCARAS DE INTERFACE
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

// Modais de Política
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

// Inicialização de Listeners de interface
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-logout-dash')?.addEventListener('click', window.logoutUser);
    document.getElementById('btn-google-login')?.addEventListener('click', window.loginWithGoogle);
    document.getElementById('switch-to-signup')?.addEventListener('click', window.toggleAuthMode);
    document.getElementById('open-privacy')?.addEventListener('click', () => window.openModal('privacy'));
    document.getElementById('open-terms')?.addEventListener('click', () => window.openModal('terms'));
    document.getElementById('close-modal')?.addEventListener('click', window.closeModal);
    
    // Fechar ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.id === 'policy-modal') window.closeModal();
    });
});