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

// --- GERENCIAMENTO DA INTERFACE ---

function updateAuthUI() {
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

// --- ESCUTADORES DE EVENTOS (EVENT LISTENERS) ---

document.addEventListener('DOMContentLoaded', () => {
    // Alternar Login/Cadastro
    const switchBtn = document.getElementById('switch-to-signup');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            updateAuthUI();
        });
    }

    // Formulário de Login/Cadastro
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o recarregamento da página
            
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
                console.error("Erro Firebase:", error.code);
                alert("Erro: " + traduzirErroFirebase(error.code));
                btn.disabled = false;
                updateAuthUI();
            }
        });
    }

    // Modais e Logout
    document.getElementById('open-privacy')?.addEventListener('click', () => openModal('privacy'));
    document.getElementById('open-terms')?.addEventListener('click', () => openModal('terms'));
    document.getElementById('close-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-logout')?.addEventListener('click', logoutUser);
    document.getElementById('btn-fb-mock')?.addEventListener('click', () => alert('Facebook em breve!'));
});

// --- GOOGLE AUTH (Obrigatório ser Global para o Script do Google encontrar) ---

window.handleCredentialResponse = async (response) => {
    const credential = GoogleAuthProvider.credential(response.credential);
    try {
        await signInWithCredential(auth, credential);
        window.location.href = "dashboard.html";
    } catch (error) {
        alert("Erro no login Google.");
    }
};

function renderGoogleButton() {
    const container = document.getElementById("google-btn-container");
    if (container && window.google) {
        google.accounts.id.initialize({
            client_id: "101312245182-00p0aknfafhhf3j5733qr7106tvefcep.apps.googleusercontent.com",
            callback: window.handleCredentialResponse
        });
        google.accounts.id.renderButton(container, { theme: "outline", size: "large", width: 200 });
    }
}

// --- MONITOR DE ESTADO ---

onAuthStateChanged(auth, (user) => {
    const userIcon = document.querySelector('img[alt="Conta"]');
    if (user) {
        if (userIcon) {
            userIcon.src = user.photoURL || "assets/icon-user.svg";
            userIcon.style.borderRadius = "50%";
            userIcon.onclick = () => window.location.href = "dashboard.html";
        }
        if (window.location.pathname.includes('dashboard.html')) {
            document.getElementById('dash-user-name').innerText = user.displayName || user.email.split('@')[0];
            document.getElementById('info-email').innerText = user.email;
        }
    } else {
        if (userIcon) userIcon.onclick = () => window.location.href = "login.html";
        if (window.location.pathname.includes('dashboard.html')) window.location.href = "login.html";
    }
});

// --- FUNÇÕES AUXILIARES ---

function logoutUser() {
    signOut(auth).then(() => window.location.href = "login.html");
}

function openModal(type) {
    const modalData = {
        privacy: `<h2>Privacidade</h2><p>Seus dados estão protegidos.</p>`,
        terms: `<h2>Termos</h2><p>Uso exclusivo MedFerpa.</p>`
    };
    document.getElementById('modal-text').innerHTML = modalData[type];
    document.getElementById('policy-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('policy-modal').style.display = 'none';
}

function traduzirErroFirebase(code) {
    switch (code) {
        case 'auth/wrong-password': return 'Senha incorreta.';
        case 'auth/user-not-found': return 'E-mail não cadastrado.';
        case 'auth/email-already-in-use': return 'E-mail já cadastrado.';
        default: return 'Erro inesperado. Tente novamente.';
    }
}

// Inicializa o botão do Google
if (document.readyState === 'complete') renderGoogleButton();
else window.addEventListener('load', renderGoogleButton);