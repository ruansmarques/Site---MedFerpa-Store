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

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- ESTADO DO FORMULÁRIO (LOGIN / CADASTRO) ---
let isLoginMode = true;

/**
 * Alterna a interface entre modo de Login e modo de Cadastro
 */
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

        // Feedback visual de carregamento
        btn.disabled = true;
        btn.innerText = "Processando...";

        try {
            if (isLoginMode) {
                // Tenta realizar login
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                // Tenta criar nova conta
                await createUserWithEmailAndPassword(auth, email, pass);
                alert("Conta criada com sucesso! Redirecionando...");
            }
            // Sucesso: redireciona para o Dashboard
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Erro Auth:", error.code);
            alert("Erro: " + traduzirErroFirebase(error.code));
            
            // Restaura o botão em caso de erro
            btn.disabled = false;
            btn.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
        }
    });
}

// --- LOGIN COM GOOGLE ---
/**
 * Callback chamado pelo SDK do Google após o usuário selecionar a conta
 */
window.handleCredentialResponse = async (response) => {
    const credential = GoogleAuthProvider.credential(response.credential);
    try {
        await signInWithCredential(auth, credential);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Erro Google Auth:", error);
        alert("Falha na autenticação com o Google. Verifique se o provedor está ativo no console do Firebase.");
    }
};

/**
 * Função para renderizar o botão oficial do Google (Google Identity Services)
 */
function renderGoogleButton() {
    const container = document.getElementById("google-btn-container");
    // Verifica se o container existe e se a biblioteca do Google carregou corretamente
    if (container && window.google) {
        google.accounts.id.initialize({
            client_id: "101312245182-00p0aknfafhhf3j5733qr7106tvefcep.apps.googleusercontent.com",
            callback: window.handleCredentialResponse
        });
        google.accounts.id.renderButton(
            container,
            { 
                theme: "outline", 
                size: "large", 
                width: container.offsetWidth > 0 ? container.offsetWidth : 200 
            }
        );
    }
}

// --- MONITOR DE SESSÃO (OBSERVER) ---
/**
 * Monitora se o usuário está logado ou não e atualiza a interface globalmente
 */
onAuthStateChanged(auth, (user) => {
    // Ícone de usuário presente no header de todas as páginas
    const userIcon = document.querySelector('img[alt="Conta"]');
    
    if (user) {
        // --- USUÁRIO LOGADO ---
        if (userIcon) {
            // Atualiza o ícone para a foto do Google ou ícone padrão com borda
            userIcon.src = user.photoURL || "assets/icon-user.svg";
            userIcon.style.borderRadius = "50%";
            userIcon.style.border = "2px solid #000";
            userIcon.style.padding = "2px";
            userIcon.title = `Minha Conta (${user.email})`;
            // Muda o destino do clique para o Dashboard
            userIcon.onclick = (e) => {
                e.preventDefault();
                window.location.href = "dashboard.html";
            };
        }

        // Se o usuário estiver na página dashboard.html, preenche as informações
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
        // --- USUÁRIO DESLOGADO ---
        if (userIcon) {
            userIcon.src = "assets/icon-user.svg";
            userIcon.style.border = "none";
            userIcon.style.padding = "0";
            userIcon.onclick = (e) => {
                e.preventDefault();
                window.location.href = "login.html";
            };
        }

        // Proteção de Rota: Se estiver no dashboard sem login, expulsa para o login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "login.html";
        }
    }
});

// --- LOGOUT ---
window.logoutUser = () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Erro ao deslogar:", error);
    });
};

// Vincula o botão de logout do dashboard se ele existir
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', window.logoutUser);
}

// --- AUXILIARES E MODAIS ---

function traduzirErroFirebase(code) {
    switch (code) {
        case 'auth/wrong-password': return 'Senha incorreta.';
        case 'auth/user-not-found': return 'E-mail não cadastrado.';
        case 'auth/email-already-in-use': return 'Este e-mail já está sendo usado por outra conta.';
        case 'auth/weak-password': return 'A senha deve ter no mínimo 6 caracteres.';
        case 'auth/invalid-email': return 'O formato do e-mail é inválido.';
        case 'auth/operation-not-allowed': return 'O método de login por e-mail não está ativado no Firebase.';
        case 'auth/popup-closed-by-user': return 'A janela de login foi fechada antes de completar.';
        default: return 'Ocorreu um erro de autenticação. Tente novamente.';
    }
}

window.openModal = (type) => {
    const modalData = {
        privacy: `<h2>Política de Privacidade</h2><p>Na MedFerpa Store, levamos a sério sua privacidade. Seus dados de navegação e compra são protegidos por criptografia SSL e não são compartilhados com terceiros.</p>`,
        terms: `<h2>Termos de Serviço</h2><p>Ao realizar o cadastro, você concorda com nossos termos de entrega tecnológica. Nossas peças são enviadas em embalagens sustentáveis com rastreamento em tempo real.</p>`
    };
    const modalText = document.getElementById('modal-text');
    const modalOverlay = document.getElementById('policy-modal');
    
    if (modalText && modalOverlay) {
        modalText.innerHTML = modalData[type] || 'Conteúdo não encontrado.';
        modalOverlay.style.display = 'flex';
    }
};

window.closeModal = () => {
    const modalOverlay = document.getElementById('policy-modal');
    if (modalOverlay) modalOverlay.style.display = 'none';
};

// --- INICIALIZAÇÃO ---

// Tenta renderizar o botão do Google assim que o script carregar ou o DOM estiver pronto
if (document.readyState === 'complete') {
    renderGoogleButton();
} else {
    window.addEventListener('load', renderGoogleButton);
}