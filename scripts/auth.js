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

// 1. CONFIGURAÇÃO OFICIAL FIREBASE (MEDFERPA STORE)
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

// --- ESTADO DO FORMULÁRIO (LOGIN / CADASTRO) ---
let isLoginMode = true;

// Função para alternar entre Login e Cadastro
window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btnMain = document.getElementById('btn-auth-main');
    const label = document.getElementById('auth-switch-label');
    const switchLink = document.getElementById('switch-to-signup');

    if (title) {
        title.innerText = isLoginMode ? "Fazer login" : "Criar conta";
        subtitle.innerText = isLoginMode ? "Faça login ou crie uma conta" : "Preencha os dados para se cadastrar";
        btnMain.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
        label.innerText = isLoginMode ? "Não tem uma conta?" : "Já possui conta?";
        switchLink.innerText = isLoginMode ? "Cadastre-se aqui" : "Faça login";
    }
};

// --- AUTENTICAÇÃO E-MAIL / SENHA ---
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
                alert("Conta criada com sucesso!");
            }
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Erro Auth:", error.code);
            alert("Erro: " + traduzirErroFirebase(error.code));
            btn.disabled = false;
            btn.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
        }
    });
}

// --- LOGIN GOOGLE ---
window.handleCredentialResponse = async (response) => {
    const credential = GoogleAuthProvider.credential(response.credential);
    try {
        await signInWithCredential(auth, credential);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Erro Google Auth:", error);
        alert("Falha no login com Google.");
    }
};

// --- LOGOUT ---
window.logoutUser = () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Erro ao sair:", error);
    });
};

// --- MONITOR DE SESSÃO (CORAÇÃO DO PROJETO) ---
onAuthStateChanged(auth, (user) => {
    const userIcon = document.querySelector('img[alt="Conta"]');
    
    if (user) {
        // Usuário está logado
        if (userIcon) {
            userIcon.src = user.photoURL || "assets/icon-user.svg";
            userIcon.style.borderRadius = "50%";
            userIcon.style.border = "2px solid #000";
            userIcon.title = `Logado como: ${user.email}`;
            userIcon.onclick = () => window.location.href = "dashboard.html";
        }

        // Se estiver no Dashboard, preenche os campos
        if (window.location.pathname.includes('dashboard.html')) {
            const dashName = document.getElementById('dash-user-name');
            const infoName = document.getElementById('info-name');
            const infoEmail = document.getElementById('info-email');
            const dashImg = document.getElementById('dash-user-img');

            if (dashName) dashName.innerText = user.displayName || user.email.split('@')[0];
            if (infoName) infoName.innerText = user.displayName || "Usuário MedFerpa";
            if (infoEmail) infoEmail.innerText = user.email;
            if (dashImg && user.photoURL) dashImg.src = user.photoURL;
        }
    } else {
        // Usuário deslogado
        if (userIcon) {
            userIcon.src = "assets/icon-user.svg";
            userIcon.style.border = "none";
            userIcon.onclick = () => window.location.href = "login.html";
        }

        // Proteção de rota: se tentar acessar dashboard sem login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "login.html";
        }
    }
});

// Auxiliar: Tradução de erros básicos
function traduzirErroFirebase(code) {
    switch (code) {
        case 'auth/wrong-password': return 'Senha incorreta.';
        case 'auth/user-not-found': return 'Usuário não encontrado.';
        case 'auth/email-already-in-use': return 'Este e-mail já está em uso.';
        case 'auth/weak-password': return 'A senha deve ter no mínimo 6 caracteres.';
        case 'auth/invalid-email': return 'E-mail inválido.';
        default: return 'Ocorreu um erro inesperado.';
    }
}

// Inicializa o botão do Google apenas se estiver na página de login
window.initGoogleAuth = () => {
    if (document.getElementById("google-btn-container")) {
        google.accounts.id.initialize({
            client_id: "101312245182-00p0aknfafhhf3j5733qr7106tvefcep.apps.googleusercontent.com",
            callback: window.handleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById("google-btn-container"),
            { theme: "outline", size: "large", width: "185" }
        );
    }
};

// Modais de Política
window.openModal = (type) => {
    const modalData = {
        privacy: `<h2>Política de Privacidade</h2><p>Seus dados estão seguros na MedFerpa Store. Utilizamos criptografia de ponta a ponta.</p>`,
        terms: `<h2>Termos de Serviço</h2><p>Ao utilizar nossa loja, você concorda com os termos de uso e entrega tecnológica.</p>`
    };
    document.getElementById('modal-text').innerHTML = modalData[type];
    document.getElementById('policy-modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('policy-modal').style.display = 'none';
};

// Gatilho de inicialização
window.addEventListener('load', window.initGoogleAuth);