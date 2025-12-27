/* ============================================================
   1. DATABASE DE PRODUTOS - MEDFERPA STORE (v.106)
   ============================================================ */

const productsData = [
    {
        id: 1,
        slug: "tech-t-shirt",
        name: "TECH T-SHIRT®",
        price: 159.00,
        model: "Camiseta",
        badges: ["BEST SELLER", "16% OFF"],
        description: "A camiseta tecnológica que não precisa passar, não desbota e não apresenta odor. Feita com fibras sustentáveis de alta tecnologia.",
        features: ["Não precisa passar", "Antiodor", "Não desbota", "Regulação térmica"],
        colors: [
            { name: "Preto", hex: "#000000", images: ["assets/p1-preto.jpg", "assets/p1-preto-2.jpg", "assets/p1-preto-3.jpg"] },
            { name: "Azul", hex: "#2121abff", images: ["assets/p1-azul.jpg", "assets/p1-azul-2.jpg", "assets/p1-azul-3.jpg"] },
            { name: "Cinza", hex: "#5f666e", images: ["assets/p1-cinza.jpg", "assets/p1-cinza-2.jpg", "assets/p1-cinza-3.jpg"] }
        ],
        sizes: ["PP", "P", "M", "G", "GG", "XGG"]
    },
    {
        id: 2,
        slug: "daily-t-shirt",
        name: "DAILY T-SHIRT",
        price: 138.00,
        model: "Camiseta",
        badges: ["NOVO"],
        description: "A peça essencial para o seu guarda-roupa básico. Conforto extremo com toque macio e caimento perfeito.",
        features: ["Toque macio", "Alta durabilidade", "Fibras nobres", "Respirável"],
        colors: [
            { name: "Branco", hex: "#ffffff", images: ["assets/p2-branco.jpg", "assets/p2-branco-2.jpg", "assets/p2-branco-3.jpg"] },
            { name: "Preto", hex: "#000000", images: ["assets/p2-preto.jpg", "assets/p2-preto-2.jpg", "assets/p2-preto-3.jpg"] },
            { name: "Verde", hex: "#0eb72dff", images: ["assets/p2-verde.jpg", "assets/p2-verde-2.jpg", "assets/p2-verde-3.jpg"] }
        ],
        sizes: ["P", "M", "G", "GG"]
    },
    {
        id: 3,
        slug: "heavy-hoodie",
        name: "HEAVY HOODIE",
        price: 459.00,
        model: "Camiseta",
        badges: ["ESSENCIAL"],
        description: "Moletom de alta gramatura com design minimalista. Ideal para manter a elegância e o conforto térmico.",
        features: ["Alta gramatura", "Interior flanelado", "Design minimalista", "Resistente"],
        colors: [
            { name: "Cinza Mescla", hex: "#d1d1d1", images: ["assets/p3-cinza.jpg", "assets/p3-cinza-2.jpg", "assets/p3-cinza-3.jpg"] },
            { name: "Preto", hex: "#000000", images: ["assets/p3-preto.jpg", "assets/p3-preto-2.jpg", "assets/p3-preto-3.jpg"] }
        ],
        sizes: ["P", "M", "G", "GG"]
    },
    {
        id: 4,
        slug: "calca-futureform",
        name: "CALÇA FUTUREFORM",
        price: 399.00,
        model: "Calça",
        badges: ["TECNOLÓGICA"],
        description: "A calça que une alfaiataria com o conforto do moletom. Tecnologia que repele líquidos.",
        features: ["Repele líquidos", "Elasticidade 4-way", "Bolso de segurança", "Cós adaptável"],
        colors: [
            { name: "Preto", hex: "#000000", images: ["assets/p4-preto.jpg", "assets/p4-preto-2.jpg", "assets/p4-preto-3.jpg"] },
            { name: "Navy", hex: "#162036", images: ["assets/p4-azul.jpg", "assets/p4-azul-2.jpg", "assets/p4-azul-3.jpg"] },
            { name: "Areia", hex: "#d2b48c", images: ["assets/p4-areia.jpg", "assets/p4-areia-2.jpg", "assets/p4-areia-3.jpg"] }
        ],
        sizes: ["40", "42", "44", "46"]
    },
    {
        id: 5,
        slug: "sportee-shirt",
        name: "SPORTEE SHIRT",
        price: 2.00,
        model: "Camiseta",
        badges: ["ANTIODOR"],
        description: "Desenvolvida para alta performance esportiva. Tecido ultra leve com rápida absorção de suor.",
        features: ["Secagem rápida", "Proteção UV 50+", "Ultra leve", "Costuras flat"],
        colors: [
            { name: "Vermelho", hex: "#8b0000", images: ["assets/p5-vermelho.jpg", "assets/p5-vermelho-2.jpg", "assets/p5-vermelho-3.jpg"] },
            { name: "Preto", hex: "#000000", images: ["assets/p5-preto.jpg", "assets/p5-preto-2.jpg", "assets/p5-preto-3.jpg"] },
            { name: "Branco", hex: "#ffffff", images: ["assets/p5-branco.jpg", "assets/p5-branco-2.jpg", "assets/p5-branco-3.jpg"] }
        ],
        sizes: ["P", "M", "G", "GG"]
    },
    {
        id: 6,
        slug: "performance-underwear",
        name: "PERFORMANCE UNDERWEAR",
        price: 89.00,
        model: "Acessórios",
        badges: ["BEST SELLER"],
        description: "Cueca tecnológica que não enrola na perna e garante frescor o dia todo.",
        features: ["Não enrola", "Respirável", "Toque de seda", "Ajuste perfeito"],
        colors: [
            { name: "Preto", hex: "#000000", images: ["assets/p6-preto.jpg", "assets/p6-preto-2.jpg", "assets/p6-preto-3.jpg"] },
            { name: "Azul", hex: "#0000ff", images: ["assets/p6-azul.jpg", "assets/p6-azul-2.jpg", "assets/p6-azul-3.jpg"] }
        ],
        sizes: ["P", "M", "G"]
    }
];