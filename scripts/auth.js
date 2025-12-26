// Textos de exemplo para o popup
const modalData = {
    privacy: `
        <h2>Política de Privacidade</h2><br>
        <p>A MedFerpa Store valoriza a sua privacidade. Seus dados são protegidos e utilizados apenas para melhorar sua experiência de compra e processar seus pedidos com segurança.</p><br>
        <p>Utilizamos criptografia de ponta a ponta para garantir que suas informações de pagamento nunca sejam expostas.</p>
    `,
    terms: `
        <h2>Termos de Serviço</h2><br>
        <p>Ao utilizar nosso site, você concorda com as políticas de trocas e devoluções vigentes, bem como com o uso correto da plataforma para compras de produtos originais da nossa marca.</p><br>
        <p>Reservamo-nos o direito de cancelar pedidos que apresentem inconsistências cadastrais.</p>
    `
};

function openModal(type) {
    const modal = document.getElementById('policy-modal');
    const textContainer = document.getElementById('modal-text');
    
    textContainer.innerHTML = modalData[type];
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('policy-modal');
    modal.style.display = 'none';
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('policy-modal');
    if (event.target == modal) {
        closeModal();
    }
}

// Lógica básica do botão continuar
document.getElementById('btn-login-continue')?.addEventListener('click', () => {
    const email = document.getElementById('user-email').value;
    if(email.includes('@')) {
        alert('Bem-vindo! Verificando seu e-mail: ' + email);
    } else {
        alert('Por favor, insira um e-mail válido.');
    }
});