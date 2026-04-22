const express = require("express");
const axios = require("axios");
const db = require("./database");
const Api = require("./api");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {

    try {
        const payment_id = req.body?.data?.id;
         console.log("WEBHOOK RECEBIDO:", req.body);

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

        if (!order || order.status !== "pending") {
            return res.sendStatus(200);
        }

        const api = new Api();

        const result = await api.order({
            service: 1,
            link: order.link,
            quantity: order.quantity
        });

        if (!result.order) {
            await db.query(
                "UPDATE orders SET status='error' WHERE id=?",
                [order.id]
            );
            return res.sendStatus(200);
        }

        await db.query(
            `UPDATE orders 
             SET status='processing', external_id=? 
             WHERE id=?`,
            [result.order, order.id]
        );

        return res.sendStatus(200);

    } catch (err) {
        console.log(err);
        return res.sendStatus(200);
    }
});

// app.listen(process.env.PORT || 3000, () => {
//     console.log("Webhook rodando");
// });

// 👇 AQUI é onde entra o código da porta
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Webhook rodando na porta " + PORT);
});
