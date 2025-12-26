// CONFIGURAÇÃO INICIAL
const GOOGLE_CLIENT_ID = "101312245182-00p0aknfafhhf3j5733qr7106tvefcep.apps.googleusercontent.com";

window.onload = function () {
    // 1. Inicializa o Google Identity Services
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse, // Função que processa o login
        auto_select: false,
        cancel_on_tap_outside: false
    });

    // 2. Renderiza o botão oficial no container
    // Personalizado para bater com o visual do seu projeto
    google.accounts.id.renderButton(
        document.getElementById("google-btn-container"),
        { 
            theme: "outline", 
            size: "large", 
            type: "standard", 
            shape: "rectangular", 
            text: "signin_with", 
            logo_alignment: "left",
            width: 185 // Largura ajustada para caber no grid do seu CSS
        }
    );

    // 3. (Opcional) Ativa o One Tap (Popup flutuante de login automático)
    google.accounts.id.prompt();
};

// FUNÇÃO QUE RECEBE OS DADOS DO GOOGLE
function handleCredentialResponse(response) {
    // O Google retorna um JWT (JSON Web Token)
    const data = parseJwt(response.credential);
    
    console.log("Login realizado com sucesso!", data);

    // Salva os dados no localStorage para usar na Home
    localStorage.setItem('user_logged', JSON.stringify({
        name: data.name,
        email: data.email,
        picture: data.picture
    }));

    // Redireciona para a home
    alert(`Olá, ${data.given_name}! Login feito com sucesso.`);
    window.location.href = "index.html";
}

// FUNÇÃO AUXILIAR PARA DECIFRAR O TOKEN DO GOOGLE
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

/* --- MANTENDO A LÓGICA DO MODAL QUE CRIAMOS ANTES --- */
const modalData = {
    privacy: `<h2>Política de Privacidade</h2><p>Conteúdo aqui...</p>`,
    terms: `<h2>Termos de Serviço</h2><p>Conteúdo aqui...</p>`
};

function openModal(type) {
    const modal = document.getElementById('policy-modal');
    document.getElementById('modal-text').innerHTML = modalData[type];
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('policy-modal').style.display = 'none';
}