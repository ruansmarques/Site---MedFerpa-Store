/**
 * SISTEMA DE AUTENTICAÇÃO E PERSISTÊNCIA - MEDFERPA STORE
 * Versão: v.105
 * 
 * Este script gerencia o ciclo de vida do usuário (Login, Cadastro, Sessão)
 * utilizando Firebase Auth e persistência de dados complementares.
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
    updatePassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. CONFIGURAÇÃO CENTRAL DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBgYUAagQzShLLAddybvinAYP17inZkYNg",
    authDomain: "medferpa-store-1cd4d.firebaseapp.com",
    projectId: "medferpa-store-1cd4d",
    storageBucket: "medferpa-store-1cd4d.firebasestorage.app",
    messagingSenderId: "902825986740",
    appId: "1:902825986740:web:f2c1f77ffba913a65ba5e1",
    measurementId: "G-YSPZM27EEK"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Estado interno da interface de login
let isLoginMode = true;

/* ============================================================
   2. MONITOR DE SESSÃO (SINCRONIZAÇÃO DE HEADER)
   ============================================================ */

onAuthStateChanged(auth, (user) => {
    const userIcon = document.getElementById('user-icon-header');
    const userLink = document.getElementById('user-link-header');
    
    if (user) {
        // --- ESTADO: USUÁRIO LOGADO ---
        // Altera o link para o Dashboard e atualiza a foto do perfil no header
        if (userLink) userLink.href = "dashboard.html";
        if (userIcon) {
            userIcon.src = user.photoURL || "assets/icon-user.svg";
            userIcon.style.borderRadius = "50%";
            userIcon.style.border = "2px solid #000";
        }

        // Se o usuário estiver na página do Dashboard, preenche as informações
        if (window.location.pathname.includes('dashboard.html')) {
            populateDashboard(user);
        }
    } else {
        // --- ESTADO: USUÁRIO DESLOGADO ---
        if (userLink) userLink.href = "login.html";
        if (userIcon) {
            userIcon.src = "assets/icon-user.svg";
            userIcon.style.border = "none";
        }

        // Proteção de Rota: Se tentar acessar o dashboard sem login, volta para o login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "login.html";
        }
    }
});

/* ============================================================
   3. LÓGICA DO DASHBOARD (MEU PERFIL)
   ============================================================ */

function populateDashboard(user) {
    const dashName = document.getElementById('dash-user-name');
    const dashEmail = document.getElementById('dash-user-email');
    const dashImg = document.getElementById('dash-user-img');
    
    // Dados Básicos do Auth
    if (dashName) dashName.innerText = user.displayName || "Usuário MedFerpa";
    if (dashEmail) dashEmail.innerText = user.email;
    if (dashImg && user.photoURL) dashImg.src = user.photoURL;

    // Preenchimento dos inputs de edição
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');
    if (editName) editName.value = user.displayName || "";
    if (editEmail) editEmail.value = user.email;

    // Recupera dados extras (Telefone/Gênero) salvos localmente vinculados ao UID
    const customData = JSON.parse(localStorage.getItem(`user_meta_${user.uid}`));
    if (customData) {
        if (document.getElementById('edit-gender')) document.getElementById('edit-gender').value = customData.gender || "não informado";
        if (document.getElementById('edit-phone')) document.getElementById('edit-phone').value = customData.phone || "";
    }

    // Recupera Endereço vinculado ao UID
    const savedAddr = JSON.parse(localStorage.getItem(`user_addr_${user.uid}`));
    if (savedAddr) {
        if (document.getElementById('addr-cep')) document.getElementById('addr-cep').value = savedAddr.cep || "";
        if (document.getElementById('addr-bairro')) document.getElementById('addr-bairro').value = savedAddr.bairro || "";
        if (document.getElementById('addr-rua')) document.getElementById('addr-rua').value = savedAddr.rua || "";
        if (document.getElementById('addr-num')) document.getElementById('addr-num').value = savedAddr.num || "";
        if (document.getElementById('addr-comp')) document.getElementById('addr-comp').value = savedAddr.comp || "";
    }

    // Renderiza a lista de pedidos (se existir)
    if (typeof window.renderUserOrders === 'function') window.renderUserOrders();
}

/* ============================================================
   4. AÇÕES DE AUTENTICAÇÃO (LOGIN / CADASTRO / SOCIAL)
   ============================================================ */

// LOGIN SOCIAL GOOGLE
window.loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Erro Google Login:", error);
    }
};

// FORMULÁRIO DE LOGIN/CADASTRO MANUAL
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
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                await createUserWithEmailAndPassword(auth, email, pass);
            }
            window.location.href = "dashboard.html";
        } catch (error) {
            alert("Erro de Autenticação: " + traduzirErroFirebase(error.code));
            btn.disabled = false;
            btn.innerText = isLoginMode ? "Entrar" : "Criar Conta";
        }
    });
}

// LOGOUT
window.logoutUser = () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
};

/* ============================================================
   5. AUXILIARES DE INTERFACE
   ============================================================ */

// Alterna entre modo Login e modo Cadastro na tela de login.html
window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btnMain = document.getElementById('btn-auth-main');
    const switchText = document.getElementById('switch-to-signup');

    if (title) {
        title.innerText = isLoginMode ? "Fazer login" : "Criar sua conta";
        subtitle.innerText = isLoginMode ? "Entre com seus dados" : "Cadastre-se para aproveitar as vantagens";
        btnMain.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
        switchText.innerText = isLoginMode ? "Cadastre-se aqui" : "Já tenho conta. Entrar";
    }
};

// Tradução de mensagens técnicas do Firebase para o usuário final
function traduzirErroFirebase(code) {
    switch (code) {
        case 'auth/invalid-credential': return 'E-mail ou senha incorretos.';
        case 'auth/email-already-in-use': return 'Este e-mail já está em uso.';
        case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
        case 'auth/user-not-found': return 'Usuário não encontrado.';
        default: return 'Ocorreu um erro inesperado. Tente novamente.';
    }
}

// Event Listeners diretos
document.getElementById('btn-logout-dash')?.addEventListener('click', window.logoutUser);
document.getElementById('btn-google-login')?.addEventListener('click', window.loginWithGoogle);
document.getElementById('switch-to-signup')?.addEventListener('click', window.toggleAuthMode);