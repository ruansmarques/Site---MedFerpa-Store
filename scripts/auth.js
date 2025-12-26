import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithCredential,
    GoogleAuthProvider,
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("🔄 [MedFerpa Auth] Iniciando sistema de autenticação...");

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

let isLoginMode = true;

// --- FUNÇÕES DE INTERFACE ---

function updateAuthUI() {
    console.log("🔄 Alternando para modo:", isLoginMode ? "LOGIN" : "CADASTRO");
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btnMain = document.getElementById('btn-auth-main');
    const label = document.getElementById('auth-switch-label');
    const switchBtn = document.getElementById('switch-to-signup');

    if (!title) return;

    if (isLoginMode) {
        title.innerText = "Fazer login";
        subtitle.innerText = "Faça login ou crie uma conta";
        btnMain.innerText = "Entrar";
        label.innerText = "Não tem uma conta?";
        switchBtn.innerText = "Cadastre-se aqui";
    } else {
        title.innerText = "Criar conta";
        subtitle.innerText = "Preencha os dados para se cadastrar";
        btnMain.innerText = "Cadastrar Agora";
        label.innerText = "Já possui conta?";
        switchBtn.innerText = "Faça login";
    }
}

// --- ATRIBUIÇÃO DE EVENTOS (Sem depender de DOMContentLoaded) ---

function initEvents() {
    const switchBtn = document.getElementById('switch-to-signup');
    if (switchBtn) {
        switchBtn.style.cursor = "pointer";
        switchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            updateAuthUI();
        });
    }

    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // CRUCIAL: Impede o recarregamento
            e.stopPropagation();
            
            console.log("🚀 Tentativa de envio de formulário...");
            
            const email = document.getElementById('user-email').value;
            const pass = document.getElementById('user-password').value;
            const btn = document.getElementById('btn-auth-main');

            if (!email || !pass) return alert("Preencha todos os campos.");

            btn.disabled = true;
            btn.innerText = "Aguarde...";

            try {
                if (isLoginMode) {
                    await signInWithEmailAndPassword(auth, email, pass);
                    console.log("✅ Login realizado!");
                } else {
                    await createUserWithEmailAndPassword(auth, email, pass);
                    console.log("✅ Conta criada!");
                }
                window.location.href = "dashboard.html";
            } catch (error) {
                console.error("❌ Erro Firebase:", error.code);
                alert("Erro: " + traduzirErroFirebase(error.code));
                btn.disabled = false;
                btn.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
            }
        });
    }

    // Modais e Facebook
    document.getElementById('open-privacy')?.addEventListener('click', () => openModal('privacy'));
    document.getElementById('open-terms')?.addEventListener('click', () => openModal('terms'));
    document.getElementById('close-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-fb-soon')?.addEventListener('click', () => alert('Facebook em breve!'));
}

// --- LOGIN GOOGLE ---

window.handleCredentialResponse = async (response) => {
    const credential = GoogleAuthProvider.credential(response.credential);
    try {
        await signInWithCredential(auth, credential);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Erro Google:", error);
        alert("Falha no login Google.");
    }
};

function renderGoogleButton() {
    const container = document.getElementById("google-btn-container");
    if (container && window.google) {
        google.accounts.id.initialize({
            client_id: "101312245182-00p0aknfafhhf3j5733qr7106tvefcep.apps.googleusercontent.com",
            callback: window.handleCredentialResponse
        });

        // ALTERAÇÃO AQUI: Mudamos o 'type' para 'icon'
        google.accounts.id.renderButton(container, { 
            type: "icon",          // Exibe apenas o ícone
            theme: "outline",      // Mantém a borda clara
            size: "large",         // Tamanho grande para alinhar com o Facebook
            shape: "square",       // Formato quadrado para combinar com o design
        });
    }
}

// --- MONITOR DE ESTADO DO USUÁRIO ---

onAuthStateChanged(auth, (user) => {
    const userIcon = document.querySelector('img[alt="Conta"]');
    if (user) {
        console.log("👤 Usuário logado:", user.email);
        if (userIcon) {
            userIcon.src = user.photoURL || "assets/icon-user.svg";
            userIcon.style.borderRadius = "50%";
            userIcon.style.border = "2px solid #000";
            userIcon.onclick = () => window.location.href = "dashboard.html";
        }
        if (window.location.pathname.includes('dashboard.html')) {
            const nameEl = document.getElementById('dash-user-name');
            if(nameEl) nameEl.innerText = user.displayName || user.email.split('@')[0];
        }
    } else {
        console.log("👤 Nenhum usuário logado.");
        if (userIcon) {
            userIcon.src = "assets/icon-user.svg";
            userIcon.style.border = "none";
            userIcon.onclick = () => window.location.href = "login.html";
        }
    }
});

// --- FUNÇÕES AUXILIARES ---

function openModal(type) {
    const modalData = {
        privacy: `<h2>Privacidade</h2><p>Seus dados são protegidos conforme a LGPD.</p>`,
        terms: `<h2>Termos</h2><p>Uso exclusivo para clientes MedFerpa Store.</p>`
    };
    const modalText = document.getElementById('modal-text');
    if(modalText) modalText.innerHTML = modalData[type];
    document.getElementById('policy-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('policy-modal').style.display = 'none';
}

function traduzirErroFirebase(code) {
    switch (code) {
        case 'auth/wrong-password': return 'Senha incorreta.';
        case 'auth/user-not-found': return 'E-mail não cadastrado.';
        case 'auth/email-already-in-use': return 'Este e-mail já possui uma conta.';
        case 'auth/weak-password': return 'A senha é muito fraca (mínimo 6 caracteres).';
        default: return 'Ocorreu um erro. Verifique sua conexão.';
    }
}

// EXECUÇÃO IMEDIATA
initEvents();
if (document.readyState === 'complete') renderGoogleButton();
else window.addEventListener('load', renderGoogleButton);

console.log("✅ [MedFerpa Auth] Sistema pronto!");