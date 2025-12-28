Esta é versão 1.06 do projeto MedFerpa Store.

ESTRUTURA DO PROJETO:

HTML:
checkout.html (Página de checkout)
dashboard.html (Página do usuário)
index.html (Página inicial)
login.html  (Página de autenticação)
product.html  (Página detalhes do produto)

CSS:
styles/checkout.css (Estilo correspondente ao checkout.html)
styles/dashboard.css (Estilo correspondente ao dashboard.html)
styles/detail-product.css (Estilo correspondente ao product.html)
styles/login.css (Estilo correspondente ao login.html)
styles/style.css (Estilo global)

JS:
scripts/auth.js (Lógica do login.html)
scripts/checkout.js (Lógica do checkout.html)
scripts/dashboard.js (Lógica do dashboard.html)
scripts/main.js (Lógica global)
scripts/product-detail.js (Lógica do product.html)
scripts/products.js (Lista de produtos da vitrine na página principal)

NOVIDADES v1.06:

1. Os dados do usuário são salvos no servidor da Firebase.
2. Ativação dos blocos de andamento e histórico de pedidos.
   - As compras realizadas pelo usuário são sincronizadas com o banco de dados da Firebase.
   - O botão "Já recebi meu pedido tem regra de permissão da Firebase para mover o pedido para o histórico.