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

// 1. CONFIGURAÇÃO (Substitua pelos SEUS dados do Firebase)
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

// --- ESTADO DO FORMULÁRIO ---
let isLoginMode = true;

// Alternar entre Login e Cadastro
const switchLink = document.getElementById('switch-to-signup');
if (switchLink) {
    switchLink.onclick = () => {
        isLoginMode = !isLoginMode;
        document.getElementById('auth-title').innerText = isLoginMode ? "Fazer login" : "Criar conta";
        document.getElementById('auth-subtitle').innerText = isLoginMode ? "Faça login ou crie uma conta" : "Preencha os dados para se cadastrar";
        document.getElementById('btn-auth-main').innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
        document.getElementById('auth-switch-label').innerText = isLoginMode ? "Não tem uma conta?" : "Já possui conta?";
        switchLink.innerText = isLoginMode ? "Cadastre-se aqui" : "Faça login";
    };
}

// --- LOGIN / CADASTRO POR E-MAIL ---
document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('user-email').value;
    const pass = document.getElementById('user-password').value;
    const btn = document.getElementById('btn-auth-main');

    btn.disabled = true;
    btn.innerText = "Aguarde...";

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, pass);
        } else {
            await createUserWithEmailAndPassword(auth, email, pass);
            alert("Conta criada com sucesso!");
        }
        window.location.href = "dashboard.html";
    } catch (error) {
        alert("Erro na autenticação: " + error.message);
        btn.disabled = false;
        btn.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
    }
});

// --- LOGIN PELO GOOGLE (Integrado ao Firebase) ---
window.handleCredentialResponse = async (response) => {
    const credential = GoogleAuthProvider.credential(response.credential);
    try {
        await signInWithCredential(auth, credential);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Erro Google Auth:", error);
    }
};

// Inicializa o botão oficial do Google
window.onload = () => {
    google.accounts.id.initialize({
        client_id: "101312245182-00p0aknfafhhf3j5733qr7106tvefcep.apps.googleusercontent.com",
        callback: window.handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("google-btn-container"),
        { theme: "outline", size: "large", width: 185 }
    );
};

// --- MONITOR DE SESSÃO E DASHBOARD ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Salva dados básicos para a Home
        localStorage.setItem('user_logged', JSON.stringify({
            name: user.displayName || user.email.split('@')[0],
            picture: user.photoURL || "assets/icon-user.svg"
        }));

        // Se estiver no dashboard, popula as infos
        if (window.location.pathname.includes('dashboard.html')) {
            document.getElementById('dash-user-name').innerText = user.displayName || user.email.split('@')[0];
            document.getElementById('info-name').innerText = user.displayName || "Não informado";
            document.getElementById('info-email').innerText = user.email;
            if(user.photoURL) document.getElementById('dash-user-img').src = user.photoURL;
        }
    } else {
        localStorage.removeItem('user_logged');
        // Proteção: Se tentar acessar dashboard sem login, volta pro login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "login.html";
        }
    }
});

// Logout
document.getElementById('btn-logout')?.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
});

/* --- MODAIS DE POLÍTICA --- */
const modalData = {
    privacy: `<h2>Política de Privacidade</h2><p>Sua privacidade é nossa prioridade. Dados protegidos pela MedFerpa.</p>`,
    terms: `<h2>Termos de Serviço</h2><p>Ao usar, você aceita nossas regras de uso e tecnologia.</p>`
};
window.openModal = (type) => {
    document.getElementById('modal-text').innerHTML = modalData[type];
    document.getElementById('policy-modal').style.display = 'flex';
};
window.closeModal = () => document.getElementById('policy-modal').style.display = 'none';