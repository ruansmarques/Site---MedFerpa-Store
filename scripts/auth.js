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
const googleProvider = new GoogleAuthProvider();

let isLoginMode = true;

/* =========================================
   2. MONITOR DE SESSÃO E CARREGAMENTO
   ========================================= */

onAuthStateChanged(auth, (user) => {
    const userIcon = document.getElementById('user-icon-header');
    const userLink = document.getElementById('user-link-header');
    
    if (user) {
        // --- USUÁRIO LOGADO ---
        if (userLink) userLink.href = "dashboard.html";
        if (userIcon) {
            userIcon.src = user.photoURL || "assets/icon-user.svg";
            userIcon.style.borderRadius = "50%";
            userIcon.style.border = "2px solid #000";
        }

        // Se estiver no dashboard, carrega as informações
        if (window.location.pathname.includes('dashboard.html')) {
            populateDashboard(user);
        }
    } else {
        // --- USUÁRIO DESLOGADO ---
        if (userLink) userLink.href = "login.html";
        if (userIcon) {
            userIcon.src = "assets/icon-user.svg";
            userIcon.style.border = "none";
        }

        // Proteção de rota: expulsa do dashboard se não estiver logado
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "login.html";
        }
    }
});

/* =========================================
   3. LÓGICA DO DASHBOARD (PÁGINA DO USUÁRIO)
   ========================================= */

function populateDashboard(user) {
    // Cabeçalho
    const dashName = document.getElementById('dash-user-name');
    const dashEmail = document.getElementById('dash-user-email');
    const dashImg = document.getElementById('dash-user-img');
    
    if (dashName) dashName.innerText = user.displayName || user.email.split('@')[0];
    if (dashEmail) dashEmail.innerText = user.email;
    if (dashImg && user.photoURL) dashImg.src = user.photoURL;

    // Campos de Edição (Perfil)
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');
    if (editName) editName.value = user.displayName || "";
    if (editEmail) editEmail.value = user.email;

    // Recupera Gênero e Telefone do LocalStorage (Persistência customizada)
    const customData = JSON.parse(localStorage.getItem(`user_custom_${user.uid}`));
    if (customData) {
        if (document.getElementById('edit-gender')) document.getElementById('edit-gender').value = customData.gender || "não informado";
        if (document.getElementById('edit-phone')) document.getElementById('edit-phone').value = customData.phone || "";
    }

    // Recupera Endereço
    const addr = JSON.parse(localStorage.getItem(`user_addr_${user.uid}`));
    if (addr) {
        document.getElementById('addr-cep').value = addr.cep || "";
        document.getElementById('addr-bairro').value = addr.bairro || "";
        document.getElementById('addr-rua').value = addr.rua || "";
        document.getElementById('addr-num').value = addr.num || "";
        document.getElementById('addr-comp').value = addr.comp || "";
    }

    // Carrega Histórico de Pedidos
    renderUserOrders();
}

// SALVAR PERFIL (NOME)
document.getElementById('save-profile')?.addEventListener('click', async () => {
    const newName = document.getElementById('edit-name').value;
    const gender = document.getElementById('edit-gender').value;
    const phone = document.getElementById('edit-phone').value;

    try {
        await updateProfile(auth.currentUser, { displayName: newName });
        
        // Salva dados extras que o Firebase Auth não guarda por padrão
        const customData = { gender, phone };
        localStorage.setItem(`user_custom_${auth.currentUser.uid}`, JSON.stringify(customData));

        alert("Dados salvos com sucesso!");
        location.reload();
    } catch (e) {
        alert("Erro ao atualizar perfil.");
    }
});

// SALVAR ENDEREÇO
document.getElementById('save-address')?.addEventListener('click', () => {
    const addrData = {
        cep: document.getElementById('addr-cep').value,
        bairro: document.getElementById('addr-bairro').value,
        rua: document.getElementById('addr-rua').value,
        num: document.getElementById('addr-num').value,
        comp: document.getElementById('addr-comp').value
    };
    localStorage.setItem(`user_addr_${auth.currentUser.uid}`, JSON.stringify(addrData));
    alert("Endereço de entrega atualizado!");
    location.reload();
});

// UPLOAD DE FOTO
document.getElementById('upload-photo')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target.result;
            try {
                await updateProfile(auth.currentUser, { photoURL: base64 });
                if(document.getElementById('dash-user-img')) document.getElementById('dash-user-img').src = base64;
                alert("Foto atualizada!");
            } catch (e) { alert("Erro ao subir foto."); }
        };
        reader.readAsDataURL(file);
    }
});

// RENDERIZAR PEDIDOS
function renderUserOrders() {
    const container = document.getElementById('active-orders-container');
    if (!container) return;

    const orders = JSON.parse(localStorage.getItem('medferpa_orders')) || [];

    if (orders.length === 0) {
        container.innerHTML = `<p class="empty-msg">Nenhum pedido realizado até o momento.</p>`;
        return;
    }

    // Renderiza em ordem decrescente (mais recentes primeiro)
    container.innerHTML = orders.reverse().map(order => `
        <div class="order-card-item" style="border: 1px solid #eee; padding: 20px; border-radius: 12px; margin-bottom: 15px; background: #fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <strong style="color:#1a73e8; font-size:15px;">Pedido #${order.id}</strong>
                <span style="font-size:11px; font-weight:800; background:#e8f0fe; color:#1a73e8; padding:5px 12px; border-radius:20px; text-transform:uppercase;">${order.status}</span>
            </div>
            <div style="font-size:13px; line-height:1.6; color:#444;">
                <p><strong>Realizado em:</strong> ${order.date}</p>
                <p><strong>Previsão de entrega:</strong> ${order.deliveryEstimate}</p>
                <p><strong>Horário:</strong> ${order.timeSlot}</p>
                <p style="margin-top:8px; padding-top:8px; border-top:1px solid #f9f9f9;"><strong>Itens:</strong> ${order.items}</p>
            </div>
            <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:800; font-size:16px;">Total: ${order.total}</span>
                <button style="background:#000; color:#fff; border:none; padding:8px 15px; border-radius:5px; font-size:12px; cursor:pointer;">Detalhes</button>
            </div>
        </div>
    `).join('');
}

/* =========================================
   4. AUTENTICAÇÃO (LOGIN / CADASTRO / GOOGLE)
   ========================================= */

// LOGIN COM GOOGLE
window.loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        window.location.href = "dashboard.html";
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') alert("Falha no login social.");
    }
};

// FORMULÁRIO E-MAIL/SENHA
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
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                await createUserWithEmailAndPassword(auth, email, pass);
            }
            window.location.href = "dashboard.html";
        } catch (error) {
            alert("Erro: " + traduzirErroFirebase(error.code));
            btn.disabled = false;
            btn.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
        }
    });
}

// ALTERAR SENHA
window.changeUserPassword = async () => {
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;

    if (newPass !== confirm) return alert("As senhas não coincidem.");
    if (newPass.length < 6) return alert("Mínimo 6 caracteres.");

    try {
        await updatePassword(auth.currentUser, newPass);
        alert("Senha atualizada com sucesso!");
    } catch (e) {
        alert("Para sua segurança, faça login novamente antes de trocar a senha.");
        signOut(auth).then(() => window.location.href = "login.html");
    }
};

// SAIR
window.logoutUser = () => {
    signOut(auth).then(() => window.location.href = "index.html");
};

// Vincula botões de clique direto
document.getElementById('btn-logout-dash')?.addEventListener('click', window.logoutUser);
document.getElementById('btn-google-login')?.addEventListener('click', window.loginWithGoogle);

/* =========================================
   5. AUXILIARES E INTERFACE
   ========================================= */

window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btnMain = document.getElementById('btn-auth-main');
    const label = document.getElementById('auth-switch-label');
    const switchBtn = document.getElementById('switch-to-signup');

    if (title) {
        title.innerText = isLoginMode ? "Fazer login" : "Criar conta";
        subtitle.innerText = isLoginMode ? "Faça login ou crie uma conta" : "Preencha os dados para se cadastrar";
        btnMain.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
        label.innerText = isLoginMode ? "Não tem uma conta?" : "Já possui conta?";
        switchBtn.innerText = isLoginMode ? "Cadastre-se aqui" : "Faça login";
    }
};

function traduzirErroFirebase(code) {
    switch (code) {
        case 'auth/wrong-password': return 'Senha incorreta.';
        case 'auth/user-not-found': return 'E-mail não cadastrado.';
        case 'auth/email-already-in-use': return 'Este e-mail já está em uso.';
        case 'auth/weak-password': return 'Senha muito fraca (mínimo 6 dígitos).';
        default: return 'Erro inesperado ao autenticar.';
    }
}

// Mascaramento de Telefone
const phoneInput = document.getElementById('edit-phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
}

// Modais
window.openModal = (type) => {
    const modalData = {
        privacy: `<h2>Privacidade</h2><p>Protegemos seus dados conforme a LGPD.</p>`,
        terms: `<h2>Termos</h2><p>Uso exclusivo MedFerpa Store.</p>`
    };
    document.getElementById('modal-text').innerHTML = modalData[type];
    document.getElementById('policy-modal').style.display = 'flex';
};

window.closeModal = () => document.getElementById('policy-modal').style.display = 'none';

document.getElementById('open-privacy')?.addEventListener('click', () => window.openModal('privacy'));
document.getElementById('open-terms')?.addEventListener('click', () => window.openModal('terms'));
document.getElementById('close-modal')?.addEventListener('click', window.closeModal);