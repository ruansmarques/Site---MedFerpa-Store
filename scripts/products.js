const productsData = [
    {
        id: 1,
        name: "TECH T-SHIRT®",
        price: 159.00,
        model: "Camiseta",
        badges: ["BEST SELLER", "16% OFF"],
        colors: [
            { name: "Preto", hex: "#000000", images: ["assets/p1-preto.jpg", "assets/p1-preto-2.jpg", "assets/p1-preto-3.jpg"] },
            { name: "Azul", hex: "#2121abff", images: ["assets/p1-azul.jpg", "assets/p1-azul-2.jpg", "assets/p1-azul-3.jpg"] },
            { name: "Cinza", hex: "#5f666e", images: ["assets/p1-cinza.jpg", "assets/p1-cinza-2.jpg", "assets/p1-cinza-3.jpg"] }
        ],
        sizes: ["PP", "P", "M", "G", "GG", "XGG"]
    },
    {
        id: 2,
        name: "DAILY T-SHIRT",
        price: 138.00,
        model: "Camiseta",
        badges: ["NOVO"],
        colors: [
            { name: "Branco", hex: "#ffffff", images: ["assets/p2-branco.jpg", "assets/p2-branco-2.jpg", "assets/p2-branco-3.jpg"] },
            { name: "Preto", hex: "#000000", images: ["assets/p2-preto.jpg", "assets/p2-preto-2.jpg", "assets/p2-preto-3.jpg"] },
            { name: "Verde", hex: "#0eb72dff", images: ["assets/p2-verde.jpg", "assets/p2-verde-2.jpg", "assets/p2-verde-3.jpg"] }
        ],
        sizes: ["P", "M", "G", "GG"]
    },
    {
        id: 3,
        name: "HEAVY HOODIE",
        price: 59.00,
        model: "Camiseta",
        badges: ["ESSENCIAL"],
        colors: [
            { name: "Cinza Mescla", hex: "#d1d1d1", images: ["assets/p3-cinza.jpg", "assets/p3-cinza-2.jpg", "assets/p3-cinza-3.jpg"] },
            { name: "Preto", hex: "#000000", images: ["assets/p3-preto.jpg", "assets/p3-preto-2.jpg", "assets/p3-preto-3.jpg"] }
        ],
        sizes: ["P", "M", "G", "GG"]
    },
    {
        id: 4,
        name: "CALÇA FUTUREFORM",
        price: 99.00,
        model: "Calça", // Note: Adicionei Calça pois o produto existe no seu catálogo
        badges: ["TECNOLÓGICA"],
        colors: [
            { name: "Preto", hex: "#000000", images: ["assets/p4-preto.jpg", "assets/p4-preto-2.jpg", "assets/p4-preto-3.jpg"] },
            { name: "Navy", hex: "#162036", images: ["assets/p4-azul.jpg", "assets/p4-azul-2.jpg", "assets/p4-azul-3.jpg"] },
            { name: "Areia", hex: "#d2b48c", images: ["assets/p4-areia.jpg", "assets/p4-areia-2.jpg", "assets/p4-areia-3.jpg"] }
        ],
        sizes: ["38", "40", "42", "44", "46"]
    },
    {
        id: 5,
        name: "SPORTEE SHIRT",
        price: 145.00,
        model: "Camiseta",
        badges: ["ANTIODOR"],
        colors: [
            { name: "Vermelho", hex: "#8b0000", images: ["assets/p5-vermelho.jpg", "assets/p5-vermelho-2.jpg", "assets/p5-vermelho-3.jpg"] },
            { name: "Preto", hex: "#000000", images: ["assets/p5-preto.jpg", "assets/p5-preto-2.jpg", "assets/p5-preto-3.jpg"] },
            { name: "Branco", hex: "#ffffff", images: ["assets/p5-branco.jpg", "assets/p5-branco-2.jpg", "assets/p5-branco-3.jpg"] }
        ],
        sizes: ["P", "M", "G", "GG"]
    },
    {
        id: 6,
        name: "PERFORMANCE UNDERWEAR",
        price: 89.00,
        model: "Acessórios",
        badges: ["BEST SELLER"],
        colors: [
            { name: "Preto", hex: "#000000", images: ["assets/p6-preto.jpg", "assets/p6-preto-2.jpg", "assets/p6-preto-3.jpg"] },
            { name: "Azul", hex: "#0000ff", images: ["assets/p6-azul.jpg", "assets/p6-azul-2.jpg", "assets/p6-azul-3.jpg"] }
        ],
        sizes: ["P", "M", "G"]
    }
];