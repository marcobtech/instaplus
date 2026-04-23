const express = require("express");
const axios = require("axios");
const db = require("./database");
const Api = require("./api");
console.log("API IMPORTADA1:", Api);

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
    try {
         console.log("WEBHOOK RECEBIDO1:", req.body);
        const payment_id = req.body?.data?.id;
        if (!payment_id) return res.sendStatus(200);

        const token = process.env.MP_TOKEN_PRD;

        const mp = await axios.get(
            `https://api.mercadopago.com/v1/payments/${payment_id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const payment = mp.data;

        if (payment.status !== "approved") {
            return res.sendStatus(200);
        }

        const [rows] = await db.query(
            "SELECT * FROM orders WHERE txid = ?",
            [payment_id]
        );

        const order = rows[0];

        if (!order) return res.sendStatus(200);

        // 🔥 TRAVA ANTI DUPLICAÇÃO
        await db.query(
            "UPDATE orders SET status='queued' WHERE id=? AND status='pending'",
            [order.id]
        );

        return res.sendStatus(200);

    } catch (err) {
        console.log("WEBHOOK ERROR:", err.message);
        return res.sendStatus(200);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Webhook rodando na porta " + PORT);
});

async function processOrders() {
    console.log("🔄 Worker rodando...");

    const [orders] = await db.query(
        "SELECT * FROM orders WHERE status='queued' LIMIT 5"
    );

    console.log("📦 Orders encontradas:", orders.length);

    for (const order of orders) {

        console.log("➡️ Processando order:", order.id);

        await db.query(
            "UPDATE orders SET status='processing' WHERE id=? AND status='queued'",
            [order.id]
        );

        const api = new Api();

        try {
            console.log("📡 Enviando para API externa...");

            const result = await api.order({
                service: 1289,
                link: order.link,
                quantity: order.quantity
            });

            console.log("📨 RESPOSTA API:", JSON.stringify(result, null, 2));

            if (result?.order) {
                console.log("✅ Sucesso API:", result.order);

                await db.query(
                    "UPDATE orders SET status='completed', external_id=? WHERE id=?",
                    [result.order, order.id]
                );

            } else {
                console.log("❌ API retornou erro lógico");

                await db.query(
                    "UPDATE orders SET status='error', response=? WHERE id=?",
                    [JSON.stringify(result), order.id]
                );
            }

        } catch (err) {
            console.log("💥 ERRO WORKER:", err.message);

            await db.query(
                "UPDATE orders SET status='error', response=? WHERE id=?",
                [err.message, order.id]
            );
        }
    }
}

async function loop() {
    console.log("Worker rodando...");
    await processOrders();
    setTimeout(loop, 10000);
}

loop();
