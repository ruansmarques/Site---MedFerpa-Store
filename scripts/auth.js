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

// Importação do Firestore para salvar dados permanentemente
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ============================================================
   1. CONFIGURAÇÃO FIREBASE E INICIALIZAÇÃO
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
const db = getFirestore(app); // Banco de dados Firestore
const googleProvider = new GoogleAuthProvider();

let isLoginMode = true;

/* ============================================================
   2. MONITOR DE SESSÃO (SINCRONIZAÇÃO DE HEADER E DASHBOARD)
   ============================================================ */
onAuthStateChanged(auth, async (user) => {
    const userIcon = document.getElementById('user-icon-header');
    const userLink = document.getElementById('user-link-header');
    
    if (user) {
        // Atualiza Header
        if (userLink) userLink.href = "dashboard.html";
        if (userIcon) {
            userIcon.src = user.photoURL || "assets/icon-user.svg";
            userIcon.style.borderRadius = "50%";
            userIcon.style.border = "2px solid #000";
        }

        // Se estiver no Dashboard, busca dados no Firestore
        if (window.location.pathname.includes('dashboard.html')) {
            loadUserDataFromFirestore(user);
        }
    } else {
        // Deslogado
        if (userLink) userLink.href = "login.html";
        if (userIcon) userIcon.src = "assets/icon-user.svg";

        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "login.html";
        }
    }
});

/* ============================================================
   3. GESTÃO DE DADOS DO USUÁRIO (FIRESTORE)
   ============================================================ */

// Carregar dados do Banco de Dados
async function loadUserDataFromFirestore(user) {
    // Referências do HTML
    const dashName = document.getElementById('dash-user-name');
    const dashEmail = document.getElementById('dash-user-email');
    const dashImg = document.getElementById('dash-user-img');
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');

    // Dados básicos do Auth
    if (dashName) dashName.innerText = user.displayName || "Usuário";
    if (dashEmail) dashEmail.innerText = user.email;
    if (dashImg) dashImg.src = user.photoURL || "assets/icon-user.svg";
    if (editName) editName.value = user.displayName || "";
    if (editEmail) editEmail.value = user.email;

    // Busca dados complementares no Firestore
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Preenche Perfil
            if (document.getElementById('edit-gender')) document.getElementById('edit-gender').value = data.gender || "não informado";
            if (document.getElementById('edit-phone')) document.getElementById('edit-phone').value = data.phone || "";
            
            // Preenche Endereço
            if (document.getElementById('addr-cep')) document.getElementById('addr-cep').value = data.address?.cep || "";
            if (document.getElementById('addr-bairro')) document.getElementById('addr-bairro').value = data.address?.bairro || "";
            if (document.getElementById('addr-rua')) document.getElementById('addr-rua').value = data.address?.rua || "";
            if (document.getElementById('addr-num')) document.getElementById('addr-num').value = data.address?.num || "";
            if (document.getElementById('addr-comp')) document.getElementById('addr-comp').value = data.address?.comp || "";
        }
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

// Salvar Perfil no Firestore
document.getElementById('save-profile')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;

    const newName = document.getElementById('edit-name').value;
    const gender = document.getElementById('edit-gender').value;
    const phone = document.getElementById('edit-phone').value;

    try {
        // 1. Atualiza nome no Auth
        await updateProfile(user, { displayName: newName });
        
        // 2. Salva no Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: newName,
            gender: gender,
            phone: phone
        }, { merge: true });

        alert("Dados salvos com sucesso!");
        location.reload();
    } catch (e) {
        alert("Erro ao salvar.");
    }
});

// Salvar Endereço no Firestore
document.getElementById('save-address')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;

    const address = {
        cep: document.getElementById('addr-cep').value,
        bairro: document.getElementById('addr-bairro').value,
        rua: document.getElementById('addr-rua').value,
        num: document.getElementById('addr-num').value,
        comp: document.getElementById('addr-comp').value
    };

    try {
        await setDoc(doc(db, "users", user.uid), { address }, { merge: true });
        alert("Endereço atualizado!");
        location.reload();
    } catch (e) {
        alert("Erro ao salvar endereço.");
    }
});

// Alterar Foto de Perfil
document.getElementById('upload-photo')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target.result;
        try {
            await updateProfile(auth.currentUser, { photoURL: base64 });
            alert("Foto atualizada!");
            location.reload();
        } catch (err) { alert("Erro no upload."); }
    };
    reader.readAsDataURL(file);
});

/* ============================================================
   4. AUTENTICAÇÃO (LOGIN, CADASTRO, GOOGLE, LOGOUT)
   ============================================================ */

window.loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error(error);
    }
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
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                await createUserWithEmailAndPassword(auth, email, pass);
            }
            window.location.href = "dashboard.html";
        } catch (error) {
            alert("Falha: " + error.code);
            btn.disabled = false;
        }
    });
}

window.logoutUser = () => signOut(auth).then(() => window.location.href = "index.html");

// Event Listeners Globais
document.getElementById('btn-logout-dash')?.addEventListener('click', window.logoutUser);
document.getElementById('btn-google-login')?.addEventListener('click', window.loginWithGoogle);

/* ============================================================
   5. MODAIS (POLÍTICA E TERMOS)
   ============================================================ */

window.openModal = (type) => {
    const modal = document.getElementById('policy-modal');
    const textBody = document.getElementById('modal-text');
    
    const content = {
        privacy: `<h2>Privacidade</h2><p>Na MedFerpa, sua segurança é prioridade. Não compartilhamos seus dados com terceiros e utilizamos criptografia Firebase para proteger seu acesso.</p>`,
        terms: `<h2>Termos de Serviço</h2><p>Ao utilizar nossa loja, você concorda com os prazos de entrega e nossa política de trocas de 30 dias. O uso indevido da conta pode levar ao bloqueio.</p>`
    };

    if (textBody) textBody.innerHTML = content[type];
    if (modal) modal.style.display = 'flex';
};

window.closeModal = () => {
    const modal = document.getElementById('policy-modal');
    if (modal) modal.style.display = 'none';
};

// Fechar modal ao clicar fora da área de conteúdo (no overlay)
window.addEventListener('click', (event) => {
    const modal = document.getElementById('policy-modal');
    if (event.target === modal) {
        window.closeModal();
    }
});

// Bind dos botões do footer de login
document.getElementById('open-privacy')?.addEventListener('click', () => window.openModal('privacy'));
document.getElementById('open-terms')?.addEventListener('click', () => window.openModal('terms'));
document.getElementById('close-modal')?.addEventListener('click', window.closeModal);

/* ============================================================
   6. AUXILIARES DE INTERFACE - BOTÃO CADASTRAR
   ============================================================ */

window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btnMain = document.getElementById('btn-auth-main');
    const label = document.getElementById('auth-switch-label');
    const switchBtn = document.getElementById('switch-to-signup');

    if (title) {
        title.innerText = isLoginMode ? "Fazer login" : "Criar sua conta";
        subtitle.innerText = isLoginMode ? "Entre com seus dados" : "Cadastre-se para aproveitar as vantagens";
        btnMain.innerText = isLoginMode ? "Entrar" : "Cadastrar Agora";
        label.innerText = isLoginMode ? "Não tem uma conta?" : "Já possui conta?";
        switchBtn.innerText = isLoginMode ? "Cadastre-se aqui" : "Faça login";
    }
};

// Reatribuição garantida dos eventos após carregamento do módulo
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('switch-to-signup')?.addEventListener('click', window.toggleAuthMode);
    document.getElementById('open-privacy')?.addEventListener('click', () => window.openModal('privacy'));
    document.getElementById('open-terms')?.addEventListener('click', () => window.openModal('terms'));
    document.getElementById('close-modal')?.addEventListener('click', window.closeModal);
});