/**
 * BACKEND DE PAGAMENTOS - MEDFERPA STORE
 * Versão: v.111 - API Real Mercado Pago (v2 SDK)
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { MercadoPagoConfig, Payment } = require('mercadopago');
const cors = require("cors")({ origin: true });

// 1. CONFIGURAÇÃO DO CLIENTE MERCADO PAGO
// SUBSTITUA 'TEST-...' PELA SUA ACCESS TOKEN DE PRODUÇÃO OU TESTE
const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-5067094499745124-122709-08c08e83b0b33aa92edae478f34f6918-327929594' 
});

/* ============================================================
   FUNÇÃO: processPayment
   Recebe o token do cartão e processa o pagamento
   ============================================================ */
exports.processPayment = onRequest({ maxInstances: 10 }, (req, res) => {
    cors(req, res, async () => {
        // Bloqueio de segurança: Apenas requisições POST
        if (req.method !== "POST") {
            return res.status(405).send("Método não permitido");
        }

        try {
            const payment = new Payment(client);
            const body = req.body;

            // Montagem do objeto de pagamento conforme exigido pelo Mercado Pago
            const paymentData = {
                body: {
                    transaction_amount: body.transaction_amount,
                    token: body.token,
                    description: body.description || "Compra MedFerpa Store",
                    installments: body.installments,
                    payment_method_id: body.payment_method_id,
                    issuer_id: body.issuer_id,
                    payer: {
                        email: body.payer.email,
                        identification: body.payer.identification
                    }
                }
            };

            // Executa a transação
            const result = await payment.create(paymentData);

            // Retorna o status para o seu frontend (checkout.js)
            res.status(200).json({
                status: result.status,
                status_detail: result.status_detail,
                id: result.id
            });

        } catch (error) {
            logger.error("Erro no processamento de pagamento:", error);
            res.status(500).json({
                error: "Erro ao processar pagamento",
                details: error.message
            });
        }
    });
});