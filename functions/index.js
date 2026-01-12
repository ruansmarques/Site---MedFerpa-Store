const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Payment } = require('mercadopago');
const cors = require("cors")({ origin: true });

// Inicializa o Firebase Admin para permitir que as funções mexam no Banco de Dados
admin.initializeApp();

const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-5067094499745124-122709-08c08e83b0b33aa92edae478f34f6918-327929594' 
});

/* ============================================================
   FUNÇÃO 1: processPayment (A que você já tem)
   ============================================================ */
exports.processPayment = onRequest({ maxInstances: 10 }, (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") return res.status(405).send("Método não permitido");
        try {
            const payment = new Payment(client);
            const body = req.body;
            const paymentData = {
                body: {
                    transaction_amount: Number(body.transaction_amount),
                    token: body.token,
                    description: body.description || "Compra MedFerpa Store",
                    installments: body.installments ? Number(body.installments) : 1,
                    payment_method_id: body.payment_method_id,
                    external_reference: String(body.external_reference), // ID do pedido
                    payer: { email: body.payer.email, identification: body.payer.identification }
                }
            };
            const result = await payment.create(paymentData);
            res.status(200).json(result);
        } catch (error) {
            logger.error("Erro Pagamento:", error);
            res.status(500).json({ message: error.message });
        }
    });
});

/* ============================================================
   FUNÇÃO 2: mercadopagoWebhook (A que está faltando!)
   ============================================================ */
exports.mercadopagoWebhook = onRequest({ maxInstances: 10 }, (req, res) => {
    // O Mercado Pago envia o ID do pagamento via query ou body
    const paymentId = req.query["data.id"] || (req.body.data && req.body.data.id);
    const type = req.query.type || req.body.type;

    if (type === "payment" && paymentId) {
        const payment = new Payment(client);
        
        payment.get({ id: paymentId }).then(async (data) => {
            // Se o status no Mercado Pago for "approved"
            if (data.status === "approved") {
                const orderNum = data.external_reference; // O número que enviamos no checkout
                const db = admin.firestore();
                
                // Procura o pedido no banco
                const snapshot = await db.collection("orders")
                                         .where("orderNumber", "==", Number(orderNum))
                                         .get();

                if (!snapshot.empty) {
                    const batch = db.batch();
                    snapshot.forEach(doc => {
                        // Muda o status de "Aguardando Pagamento" para "Pagamento Aprovado"
                        batch.update(doc.ref, { status: "Pagamento Aprovado" });
                    });
                    await batch.commit();
                    logger.info(`Pedido #${orderNum} APROVADO via Webhook.`);
                }
            }
        }).catch(err => logger.error("Erro no Webhook:", err));
    }

    // O Mercado Pago exige que você responda 200 sempre
    res.status(200).send("OK");
});