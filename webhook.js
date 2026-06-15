// const express = require("express");
// const db = require("./database");

// const Painelpro = require("./api");
// const Morethanpanel = require("./apiTiktok");

// const app = express();
// app.use(express.json());

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log("🚀 Worker rodando na porta " + PORT);
// });

// app.post("/teste", async (req, res) => {

//     if (req.body?.ping) {
//         return res.sendStatus(200);
//     }

//     console.log("WEBHOOK REAL:", req.body);

//     return res.sendStatus(200);
// });

// /**
//  * 🔥 WEBHOOK ASAAS
//  */
// async function handleAsaasWebhook(req, res, env = "PRD") {

//     try {

//         console.log(`\n📩 WEBHOOK ASAAS ${env}`);

//         console.log(JSON.stringify(req.body, null, 2));

//         const payment = req.body.payment;

//         if (!payment) {
//             return res.sendStatus(200);
//         }

//         const txid = payment.id;

//         const event = req.body.event;

//         console.log(`📌 EVENTO: ${event}`);
//         console.log(`💳 TXID: ${txid}`);

//         /**
//          * ✅ PAGAMENTO RECEBIDO
//          */
//         if (
//             event === "PAYMENT_RECEIVED" ||
//             event === "PAYMENT_CONFIRMED"
//         ) {

//             const [update] = await db.query(`
//                 UPDATE orders
//                 SET status = 'queued'
//                 WHERE txid = ?
//                 AND status = 'pending'
//             `, [txid]);

//             console.log(`✅ Pedido atualizado`);
//             console.log(`📝 Rows: ${update.affectedRows}`);
//         }

//         /**
//          * ⌛ PIX EXPIRADO
//          */
//         if (event === "PAYMENT_OVERDUE") {

//             await db.query(`
//                 UPDATE orders
//                 SET status = 'expired'
//                 WHERE txid = ?
//             `, [txid]);

//             console.log("⌛ PIX expirado");
//         }

//         /**
//          * 💸 ESTORNO
//          */
//         if (
//             event === "PAYMENT_DELETED" ||
//             event === "PAYMENT_REFUNDED"
//         ) {

//             await db.query(`
//                 UPDATE orders
//                 SET status = 'refunded'
//                 WHERE txid = ?
//             `, [txid]);

//             console.log("💸 Pagamento estornado");
//         }

//         return res.sendStatus(200);

//     } catch (err) {

//         console.log(`💥 ERRO WEBHOOK ${env}:`, err.message);

//         return res.sendStatus(500);
//     }
// }
// async function sendTelegram(message) {

//     const token = process.env.TELEGRAM_TOKEN;
//     const chatId = process.env.TELEGRAM_CHAT_ID;

//     const response = await fetch(
//         `https://api.telegram.org/bot${token}/sendMessage`,
//         {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 chat_id: chatId,
//                 text: message
//             })
//         }
//     );

//     const data = await response.json();

//     console.log("Telegram:", data);

//     return data;
// }

// /**
//  * 🧪 SANDBOX
//  */
// app.post("/webhook/mp/hml", async (req, res) => {

//    try {

//         const paymentId = req.body?.data?.id;

//         if (!paymentId) {
//             return res.sendStatus(200);
//         }

//         const response = await fetch(
//             `https://api.mercadopago.com/v1/payments/${paymentId}`,
//             {
//                 headers: {
//                     Authorization:
//                         `Bearer ${process.env.MP_TOKEN_HML}`
//                 }
//             }
//         );

//         const payment = await response.json();

//         console.log(payment);

//         const txid = String(payment.id);

//         if (payment.status === "approved") {

//             await db.query(`
//                 UPDATE orders
//                 SET status = 'queued'
//                 WHERE txid = ?
//                 AND status = 'pending'
//             `, [txid]);

//             console.log("✅ PIX aprovado");
            
//             const [update] = await db.query(`
//                 UPDATE orders
//                 SET status = 'queued'
//                 WHERE txid = ?
//                 AND status = 'pending'
//             `, [txid]);

//             if (update.affectedRows > 0) {

//                 const [orderRows] = await db.query(`
//                     SELECT *
//                     FROM orders
//                     WHERE txid = ?
//                     LIMIT 1
//                 `, [txid]);

//                 const order = orderRows[0];

//                 await sendTelegram(`🔥 NOVA VENDA

//             💰 Valor: R$ ${order.amount}
//             📱 Plataforma: ${order.platform}
//             📦 Quantidade: ${order.quantity}
//             📞 WhatsApp: ${order.whatsapp}

//             🆔 Pedido: ${order.id}`);
//             }

//         }

//         else if (
//             payment.status === "cancelled" ||
//             payment.status === "rejected"
//         ) {

//             await db.query(`
//                 UPDATE orders
//                 SET status = 'expired'
//                 WHERE txid = ?
//             `, [txid]);

//             console.log("⌛ PIX expirado");
//         }

//         else if (
//             payment.status === "refunded"
//         ) {

//             await db.query(`
//                 UPDATE orders
//                 SET status = 'refunded'
//                 WHERE txid = ?
//             `, [txid]);

//             console.log("💸 PIX estornado");
//         }

//         return res.sendStatus(200);

//     } catch (err) {

//         console.log(err);

//         return res.sendStatus(500);
//     }
// });

// /**
//  * 🚀 PRODUÇÃO
//  */
// app.post("/webhook/mp/prd", async (req, res) => {

//     try {

//         const paymentId = req.body?.data?.id;

//         if (!paymentId) {
//             return res.sendStatus(200);
//         }

//         const response = await fetch(
//             `https://api.mercadopago.com/v1/payments/${paymentId}`,
//             {
//                 headers: {
//                     Authorization:
//                         `Bearer ${process.env.MP_TOKEN_PRD}`
//                 }
//             }
//         );

//         const payment = await response.json();

//         console.log(payment);

//         const txid = String(payment.id);

//         if (payment.status === "approved") {

//             await db.query(`
//                 UPDATE orders
//                 SET status = 'queued'
//                 WHERE txid = ?
//                 AND status = 'pending'
//             `, [txid]);

//             console.log("✅ PIX aprovado");

//             const [update] = await db.query(`
//                 UPDATE orders
//                 SET status = 'queued'
//                 WHERE txid = ?
//                 AND status = 'pending'
//             `, [txid]);

//             if (update.affectedRows > 0) {

//                 const [orderRows] = await db.query(`
//                     SELECT *
//                     FROM orders
//                     WHERE txid = ?
//                     LIMIT 1
//                 `, [txid]);

//                 const order = orderRows[0];

//                 await sendTelegram(`🔥 NOVA VENDA

//             💰 Valor: R$ ${order.amount}
//             📱 Plataforma: ${order.platform}
//             📦 Quantidade: ${order.quantity}
//             📞 WhatsApp: ${order.whatsapp}

//             🆔 Pedido: ${order.id}`);
//             }
//         }

//         else if (
//             payment.status === "cancelled" ||
//             payment.status === "rejected"
//         ) {

//             await db.query(`
//                 UPDATE orders
//                 SET status = 'expired'
//                 WHERE txid = ?
//             `, [txid]);

//             console.log("⌛ PIX expirado");
//         }

//         else if (
//             payment.status === "refunded"
//         ) {

//             await db.query(`
//                 UPDATE orders
//                 SET status = 'refunded'
//                 WHERE txid = ?
//             `, [txid]);

//             console.log("💸 PIX estornado");
//         }

//         return res.sendStatus(200);

//     } catch (err) {

//         console.log(err);

//         return res.sendStatus(500);
//     }
// });


// /**
//  * 🚀 SANDBOX Marco
//  */
// app.post("/webhook/asaas", async (req, res) => {

//     return handleAsaasWebhook(req, res, "HML");
// });

// /**
//  * 🔥 RESOLVE PROVIDER
//  */
// function getProviderApi(provider) {

//     if (!provider) {
//         return null;
//     }

//     provider = provider.toLowerCase();

//     switch (provider) {

//         case "painelpro":
//             return new Painelpro();

//         case "morethanpanel":
//             return new Morethanpanel();

//         default:
//             return null;
//     }
// }

// /**
//  * 🔥 ENVIA PEDIDOS
//  */
// async function processOrders() {

//     console.log("V4.0📤 Processando fila...");

//     const [orders] = await db.query(`
//         SELECT * FROM orders o
//         WHERE o.status = 'queued'
//         AND NOT EXISTS (
//             SELECT 1 FROM orders
//             WHERE link = o.link
//             AND status = 'processing'
//         )
//         ORDER BY o.id ASC
//         LIMIT 5
//     `);

//     console.log(`📦 ${orders.length} pedidos`);

//     for (const order of orders) {

//         const api = getProviderApi(order.provider);

//         if (!api) {
//             console.log(`⚠️ Provider inválido pedido ${order.id}`);
//             continue;
//         }

//         console.log(`➡️ Pedido ${order.id}`);
//         console.log(`🏢 Provider: ${order.provider}`);

//         // 🔒 trava concorrência
//         const [update] = await db.query(
//             "UPDATE orders SET status='processing' WHERE id=? AND status='queued'",
//             [order.id]
//         );

//         if (update.affectedRows === 0) {
//             console.log("⚠️ Já processado");
//             continue;
//         }

//         try {

//             const result = await api.order({
//                 service: order.service_id,
//                 link: order.link,
//                 quantity: order.quantity
//             });

//             console.log("📨 RESPOSTA:", result);

//             if (result?.order) {

//                 await db.query(
//                     "UPDATE orders SET external_id=?, status='processing' WHERE id=?",
//                     [result.order, order.id]
//                 );

//                 console.log(`✅ Pedido ${order.id} enviado`);

//             } else {

//                 await db.query(
//                     "UPDATE orders SET status='error', response=? WHERE id=?",
//                     [JSON.stringify(result), order.id]
//                 );

//                 console.log(`❌ Erro pedido ${order.id}`);
//             }

//         } catch (err) {

//             await db.query(
//                 "UPDATE orders SET status='error', response=? WHERE id=?",
//                 [err.message, order.id]
//             );

//             console.log(`💥 ERRO pedido ${order.id}:`, err.message);
//         }
//     }
// }

// /**
//  * 🔍 VERIFICA STATUS
//  */
// async function checkOrderStatus() {

//     console.log("🔎 Verificando status...");

//     const [orders] = await db.query(`
//         SELECT * FROM orders
//         WHERE status = 'processing'
//         AND external_id IS NOT NULL
//         LIMIT 10
//     `);

//     if (orders.length === 0) {
//         console.log("😴 Nenhum pedido");
//         return;
//     }

//     for (const order of orders) {

//         const api = getProviderApi(order.provider);

//         if (!api) {
//             console.log(`⚠️ Provider inválido pedido ${order.id}`);
//             continue;
//         }

//         try {

//             const res = await api.status(order.external_id);

//             if (!res || !res.status) {
//                 console.log(`⚠️ Sem status pedido ${order.id}`);
//                 continue;
//             }

//             const status = res.status.toLowerCase();

//             console.log(`📊 Pedido ${order.id} → ${status}`);

//             // 🔄 PROCESSANDO
//             if (['pending', 'processing', 'in progress'].includes(status)) {
//                 continue;
//             }

//             // ✅ COMPLETO
//             if (status === 'completed') {

//                 await db.query(
//                     "UPDATE orders SET status='completed' WHERE id=?",
//                     [order.id]
//                 );

//                 console.log(`🎉 Pedido ${order.id} concluído`);
//             }

//             // ⚠️ PARCIAL
//             else if (status === 'partial') {

//                 await db.query(
//                     "UPDATE orders SET status='partial' WHERE id=?",
//                     [order.id]
//                 );

//                 console.log(`⚠️ Pedido ${order.id} parcial`);
//             }

//             // ❌ CANCELADO
//             else if (['canceled', 'cancelled'].includes(status)) {

//                 await db.query(
//                     "UPDATE orders SET status='canceled' WHERE id=?",
//                     [order.id]
//                 );

//                 console.log(`❌ Pedido ${order.id} cancelado`);
//             }

//         } catch (err) {

//             console.log(`💥 ERRO status ${order.id}:`, err.message);
//         }
//     }
// }

// /**
//  * 🔁 LOOP
//  */
// async function loop() {

//     try {

//         console.log("\n🔁 =======================");

//         await processOrders();

//         await checkOrderStatus();

//     } catch (err) {

//         console.log("💥 ERRO GERAL:", err.message);
//     }

//     setTimeout(loop, 10000);
// }

// loop();


const express = require("express");
const db = require("./database");

const Painelpro = require("./api");
const Morethanpanel = require("./apiTiktok");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Worker rodando na porta " + PORT);
});

app.post("/teste", async (req, res) => {

    if (req.body?.ping) {
        return res.sendStatus(200);
    }

    console.log("WEBHOOK REAL:", req.body);

    return res.sendStatus(200);
});

/**
 * 🔥 WEBHOOK ASAAS
 */
async function handleAsaasWebhook(req, res, env = "PRD") {

    try {

        console.log(`\n📩 WEBHOOK ASAAS ${env}`);

        console.log(JSON.stringify(req.body, null, 2));

        const payment = req.body.payment;

        if (!payment) {
            return res.sendStatus(200);
        }

        const txid = payment.id;

        const event = req.body.event;

        console.log(`📌 EVENTO: ${event}`);
        console.log(`💳 TXID: ${txid}`);

        /**
         * ✅ PAGAMENTO RECEBIDO
         */
        if (
            event === "PAYMENT_RECEIVED" ||
            event === "PAYMENT_CONFIRMED"
        ) {

            const [update] = await db.query(`
                UPDATE orders
                SET status = 'queued'
                WHERE txid = ?
                AND status = 'pending'
            `, [txid]);

            console.log(`✅ Pedido atualizado`);
            console.log(`📝 Rows: ${update.affectedRows}`);
        }

        /**
         * ⌛ PIX EXPIRADO
         */
        if (event === "PAYMENT_OVERDUE") {

            await db.query(`
                UPDATE orders
                SET status = 'expired'
                WHERE txid = ?
            `, [txid]);

            console.log("⌛ PIX expirado");
        }

        /**
         * 💸 ESTORNO
         */
        if (
            event === "PAYMENT_DELETED" ||
            event === "PAYMENT_REFUNDED"
        ) {

            await db.query(`
                UPDATE orders
                SET status = 'refunded'
                WHERE txid = ?
            `, [txid]);

            console.log("💸 Pagamento estornado");
        }

        return res.sendStatus(200);

    } catch (err) {

        console.log(`💥 ERRO WEBHOOK ${env}:`, err.message);

        return res.sendStatus(500);
    }
}

async function sendTelegram(message) {

    if (!process.env.TELEGRAM_TOKEN) {
        console.log("TELEGRAM_TOKEN não configurado");
        return;
    }

    if (!process.env.TELEGRAM_CHAT_ID) {
        console.log("TELEGRAM_CHAT_ID não configurado");
        return;
    }

    const response = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message
            })
        }
    );

    const data = await response.json();

    console.log("Telegram:", data);

    return data;
}

/**
 * 🧪 SANDBOX
 */
app.post("/webhook/mp/hml", async (req, res) => {

   try {

        const paymentId = req.body?.data?.id;

        if (!paymentId) {
            return res.sendStatus(200);
        }

        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.MP_TOKEN_HML}`
                }
            }
        );

        const payment = await response.json();

        console.log(payment);

        const txid = String(payment.id);

        if (payment.status === "approved") {

            const [update] = await db.query(`
                UPDATE orders
                SET status = 'queued'
                WHERE txid = ?
                AND status = 'pending'
            `, [txid]);

            console.log("✅ PIX aprovado");
            console.log("Rows:", update.affectedRows);

            if (update.affectedRows > 0) {

                const [orderRows] = await db.query(`
                    SELECT *
                    FROM orders
                    WHERE txid = ?
                    LIMIT 1
                `, [txid]);

                const order = orderRows[0];

                if (order) {

                    await sendTelegram(`🔥 NOVA VENDA

        💰 Valor: R$ ${order.amount}
        📱 Plataforma: ${order.platform}
        📦 Quantidade: ${order.quantity}
        📞 WhatsApp: ${order.whatsapp}

        🆔 Pedido: ${order.id}`);
                }
            }
        }

        else if (
            payment.status === "cancelled" ||
            payment.status === "rejected"
        ) {

            await db.query(`
                UPDATE orders
                SET status = 'expired'
                WHERE txid = ?
            `, [txid]);

            console.log("⌛ PIX expirado");
        }

        else if (
            payment.status === "refunded"
        ) {

            await db.query(`
                UPDATE orders
                SET status = 'refunded'
                WHERE txid = ?
            `, [txid]);

            console.log("💸 PIX estornado");
        }

        return res.sendStatus(200);

    } catch (err) {

        console.log(err);

        return res.sendStatus(500);
    }
});

/**
 * 🚀 PRODUÇÃO
 */
app.post("/webhook/mp/prd", async (req, res) => {

    try {

        const paymentId = req.body?.data?.id;

        if (!paymentId) {
            return res.sendStatus(200);
        }

        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.MP_TOKEN_PRD}`
                }
            }
        );

        const payment = await response.json();

        console.log(payment);

        const txid = String(payment.id);

        if (payment.status === "approved") {

            const [update] = await db.query(`
                UPDATE orders
                SET status = 'queued'
                WHERE txid = ?
                AND status = 'pending'
            `, [txid]);

            console.log("✅ PIX aprovado");
            console.log("Rows:", update.affectedRows);

            if (update.affectedRows > 0) {

                const [orderRows] = await db.query(`
                    SELECT *
                    FROM orders
                    WHERE txid = ?
                    LIMIT 1
                `, [txid]);

                const order = orderRows[0];

                if (order) {

                    await sendTelegram(`🔥 NOVA VENDA

        💰 Valor: R$ ${order.amount}
        📱 Plataforma: ${order.platform}
        📦 Quantidade: ${order.quantity}
        📞 WhatsApp: ${order.whatsapp}

        🆔 Pedido: ${order.id}`);
                }
            }
        }

        else if (
            payment.status === "cancelled" ||
            payment.status === "rejected"
        ) {

            await db.query(`
                UPDATE orders
                SET status = 'expired'
                WHERE txid = ?
            `, [txid]);

            console.log("⌛ PIX expirado");
        }

        else if (
            payment.status === "refunded"
        ) {

            await db.query(`
                UPDATE orders
                SET status = 'refunded'
                WHERE txid = ?
            `, [txid]);

            console.log("💸 PIX estornado");
        }

        return res.sendStatus(200);

    } catch (err) {

        console.log(err);

        return res.sendStatus(500);
    }
});


/**
 * 🚀 SANDBOX Marco
 */
app.post("/webhook/asaas", async (req, res) => {

    return handleAsaasWebhook(req, res, "HML");
});

/**
 * 🔥 RESOLVE PROVIDER
 */
function getProviderApi(provider) {

    if (!provider) {
        return null;
    }

    provider = provider.toLowerCase();

    switch (provider) {

        case "painelpro":
            return new Painelpro();

        case "morethanpanel":
            return new Morethanpanel();

        default:
            return null;
    }
}

/**
 * 🔥 ENVIA PEDIDOS
 */
async function processOrders() {

    console.log("V4.0📤 Processando fila...");

    const [orders] = await db.query(`
        SELECT * FROM orders o
        WHERE o.status = 'queued'
        AND NOT EXISTS (
            SELECT 1 FROM orders
            WHERE link = o.link
            AND status = 'processing'
        )
        ORDER BY o.id ASC
        LIMIT 5
    `);

    console.log(`📦 ${orders.length} pedidos`);

    for (const order of orders) {

        const api = getProviderApi(order.provider);

        if (!api) {
            console.log(`⚠️ Provider inválido pedido ${order.id}`);
            continue;
        }

        console.log(`➡️ Pedido ${order.id}`);
        console.log(`🏢 Provider: ${order.provider}`);

        // 🔒 trava concorrência
        const [update] = await db.query(
            "UPDATE orders SET status='processing' WHERE id=? AND status='queued'",
            [order.id]
        );

        if (update.affectedRows === 0) {
            console.log("⚠️ Já processado");
            continue;
        }

        try {

            const result = await api.order({
                service: order.service_id,
                link: order.link,
                quantity: order.quantity
            });

            console.log("📨 RESPOSTA:", result);

            if (result?.order) {

                await db.query(
                    "UPDATE orders SET external_id=?, status='processing' WHERE id=?",
                    [result.order, order.id]
                );

                console.log(`✅ Pedido ${order.id} enviado`);

            } else {

                await db.query(
                    "UPDATE orders SET status='error', response=? WHERE id=?",
                    [JSON.stringify(result), order.id]
                );

                console.log(`❌ Erro pedido ${order.id}`);
            }

        } catch (err) {

            await db.query(
                "UPDATE orders SET status='error', response=? WHERE id=?",
                [err.message, order.id]
            );

            console.log(`💥 ERRO pedido ${order.id}:`, err.message);
        }
    }
}

/**
 * 🔍 VERIFICA STATUS
 */
async function checkOrderStatus() {

    console.log("🔎 Verificando status...");

    const [orders] = await db.query(`
        SELECT * FROM orders
        WHERE status = 'processing'
        AND external_id IS NOT NULL
        LIMIT 10
    `);

    if (orders.length === 0) {
        console.log("😴 Nenhum pedido");
        return;
    }

    for (const order of orders) {

        const api = getProviderApi(order.provider);

        if (!api) {
            console.log(`⚠️ Provider inválido pedido ${order.id}`);
            continue;
        }

        try {

            const res = await api.status(order.external_id);

            if (!res || !res.status) {
                console.log(`⚠️ Sem status pedido ${order.id}`);
                continue;
            }

            const status = res.status.toLowerCase();

            console.log(`📊 Pedido ${order.id} → ${status}`);

            // 🔄 PROCESSANDO
            if (['pending', 'processing', 'in progress'].includes(status)) {
                continue;
            }

            // ✅ COMPLETO
            if (status === 'completed') {

                await db.query(
                    "UPDATE orders SET status='completed' WHERE id=?",
                    [order.id]
                );

                console.log(`🎉 Pedido ${order.id} concluído`);
            }

            // ⚠️ PARCIAL
            else if (status === 'partial') {

                await db.query(
                    "UPDATE orders SET status='partial' WHERE id=?",
                    [order.id]
                );

                console.log(`⚠️ Pedido ${order.id} parcial`);
            }

            // ❌ CANCELADO
            else if (['canceled', 'cancelled'].includes(status)) {

                await db.query(
                    "UPDATE orders SET status='canceled' WHERE id=?",
                    [order.id]
                );

                console.log(`❌ Pedido ${order.id} cancelado`);
            }

        } catch (err) {

            console.log(`💥 ERRO status ${order.id}:`, err.message);
        }
    }
}

/**
 * 🔁 LOOP
 */
async function loop() {

    try {

        console.log("\n🔁 =======================");

        await processOrders();

        await checkOrderStatus();

    } catch (err) {

        console.log("💥 ERRO GERAL:", err.message);
    }

    setTimeout(loop, 10000);
}

loop();
