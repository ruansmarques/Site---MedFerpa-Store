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

// CONFIGURAÇÃO FIREBASE
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
const provider = new GoogleAuthProvider();

let isLoginMode = true;

// --- LOGIN COM GOOGLE (POPUP) ---
async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, provider);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Erro Google:", error);
        if(error.code !== 'auth/popup-closed-by-user') {
            alert("Erro ao entrar com Google. Verifique se os pop-ups estão permitidos.");
        }
    }
}

// --- INTERFACE ---
function updateAuthUI() {
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btnMain = document.getElementById('btn-auth-main');
    const label = document.getElementById('auth-switch-label');
    const switchBtn = document.getElementById('switch-to-signup');

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

// --- EVENTOS ---
function initEvents() {
    // Botão de Alternar Login/Cadastro
    document.getElementById('switch-to-signup')?.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        updateAuthUI();
    });

    // Botão Google
    document.getElementById('btn-google-login')?.addEventListener('click', loginWithGoogle);

    // Botão Facebook (Apenas Alerta por enquanto)
    document.getElementById('btn-fb-login')?.addEventListener('click', () => {
        alert("O login via Facebook estará disponível em breve!");
    });

    // Formulário E-mail/Senha
    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('user-email').value;
        const pass = document.getElementById('user-password').value;
        const btn = document.getElementById('btn-auth-main');

        if (!email || !pass) return;

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
            alert("Erro: " + traduzirErroFirebase(error.code));
            btn.disabled = false;
            updateAuthUI();
        }
    });

    // Modais
    document.getElementById('open-privacy')?.addEventListener('click', () => openModal('privacy'));
    document.getElementById('open-terms')?.addEventListener('click', () => openModal('terms'));
    document.getElementById('close-modal')?.addEventListener('click', closeModal);
}

// --- 1. FOTO DE PERFIL DO USUÁRIO NO DASHBOARD ---
onAuthStateChanged(auth, (user) => {
    const userIcon = document.getElementById('user-icon-header');
    const userLink = document.getElementById('user-link-header');
    
    if (user) {
        if (userLink) userLink.href = "dashboard.html";
        if (userIcon) {
            userIcon.src = user.photoURL || "assets/icon-user.svg";
            userIcon.style.borderRadius = "50%";
            userIcon.style.border = "2px solid #000";
        }
    } else {
        if (userLink) userLink.href = "login.html";
        if (userIcon) {
            userIcon.src = "assets/icon-user.svg";
            userIcon.style.border = "none";
        }
    }
});

// --- 1. DADOS DO USUÁRIO NO DASHBOARD ---
onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes('dashboard.html')) {
        // Preenche Nome e Email no Header do Dash
        const dashName = document.getElementById('dash-user-name');
        const dashEmail = document.getElementById('dash-user-email');
        const dashImg = document.getElementById('dash-user-img');
        const editName = document.getElementById('edit-name');
        const editEmail = document.getElementById('edit-email');

        if(dashName) dashName.innerText = user.displayName || user.email.split('@')[0];
        if(dashEmail) dashEmail.innerText = user.email;
        if(editName) editName.value = user.displayName || "";
        if(editEmail) editEmail.value = user.email;
        if(dashImg && user.photoURL) dashImg.src = user.photoURL;
    }
});

// --- 2. UPLOAD DE FOTO DE PERFIL ---
const uploadInput = document.getElementById('upload-photo');
const dashImg = document.getElementById('dash-user-img');

if (uploadInput) {
    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Image = event.target.result;
                // Atualiza visualmente na hora
                if(dashImg) dashImg.src = base64Image;
                
                // Salva no perfil do Firebase (URL)
                try {
                    await updateProfile(auth.currentUser, { photoURL: base64Image });
                    alert("Foto de perfil atualizada!");
                } catch (error) {
                    console.error("Erro ao salvar foto:", error);
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// --- 3. SAIR DA CONTA ---
const btnLogoutDash = document.getElementById('btn-logout-dash');
if (btnLogoutDash) {
    btnLogoutDash.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = "index.html"; // Redireciona para Home
        });
    });
}

// --- 4. FORMATAÇÃO DE TELEFONE (PADRÃO BR) ---
const phoneInput = document.getElementById('edit-phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
}

// --- 5. ALTERAR SENHA ---
window.changeUserPassword = async () => {
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;

    if (newPass.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    if (newPass !== confirmPass) return alert("As senhas não coincidem.");

    try {
        await updatePassword(auth.currentUser, newPass);
        alert("Senha atualizada com sucesso!");
        document.getElementById('new-password').value = "";
        document.getElementById('confirm-password').value = "";
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            alert("Para sua segurança, faça login novamente antes de alterar a senha.");
            signOut(auth).then(() => window.location.href = "login.html");
        } else {
            alert("Erro ao atualizar senha: " + error.message);
        }
    }
};

// --- AUXILIARES ---
function openModal(type) {
    const modalData = {
        privacy: `<h2>Privacidade</h2><p>Seus dados estão protegidos conforme a LGPD.</p>`,
        terms: `<h2>Termos</h2><p>Uso exclusivo para clientes MedFerpa Store.</p>`
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
        case 'auth/email-already-in-use': return 'Este e-mail já possui uma conta.';
        case 'auth/weak-password': return 'Senha muito fraca (mínimo 6 dígitos).';
        default: return 'Erro inesperado. Tente novamente.';
    }
}

// Listener do Botão Sair no Dashboard
document.getElementById('btn-logout-dash')?.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "index.html"; // Volta para a home ao deslogar
    });
});

initEvents();