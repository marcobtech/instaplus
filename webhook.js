// const express = require("express");
// const axios = require("axios");
// const db = require("./database");
// const Api = require("./api");

// const app = express();
// app.use(express.json());

// app.post("/webhook", async (req, res) => {

//     try {
//         const payment_id = req.body?.data?.id;
//          console.log("WEBHOOK RECEBIDO:", req.body);

//         if (!payment_id) return res.sendStatus(200);

//         const token = process.env.MP_TOKEN_PRD;

//         const mp = await axios.get(
//             `https://api.mercadopago.com/v1/payments/${payment_id}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             }
//         );

//         const payment = mp.data;

//         if (payment.status !== "approved") {
//             return res.sendStatus(200);
//         }

//         const [rows] = await db.query(
//             "SELECT * FROM orders WHERE txid = ?",
//             [payment_id]
//         );

//         const order = rows[0];

//         if (!order || order.status !== "pending") {
//             return res.sendStatus(200);
//         }

//         const api = new Api();

//         const result = await api.order({
//             service: 1,
//             link: order.link,
//             quantity: order.quantity
//         });

//         if (!result.order) {
//             await db.query(
//                 "UPDATE orders SET status='error' WHERE id=?",
//                 [order.id]
//             );
//             return res.sendStatus(200);
//         }

//         await db.query(
//             `UPDATE orders 
//              SET status='processing', external_id=? 
//              WHERE id=?`,
//             [result.order, order.id]
//         );

//         return res.sendStatus(200);

//     } catch (err) {
//         console.log(err);
//         return res.sendStatus(200);
//     }
// });

// // app.listen(process.env.PORT || 3000, () => {
// //     console.log("Webhook rodando");
// // });

// // 👇 AQUI é onde entra o código da porta
// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log("Webhook rodando na porta " + PORT);
// });


// const express = require("express");
// const axios = require("axios");
// const db = require("./database");
// const Api = require("./api");

// const app = express();
// app.use(express.json());

// app.post("/webhook", async (req, res) => {

//     try {
//         console.log("WEBHOOK RECEBIDO:", JSON.stringify(req.body));

//         const payment_id = req.body?.data?.id;
//         if (!payment_id) return res.sendStatus(200);

//         const token = process.env.MP_TOKEN_PRD;

//         // 🔥 busca pagamento real
//         const mp = await axios.get(
//             `https://api.mercadopago.com/v1/payments/${payment_id}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 },
//                  timeout: 10000
//             }
//         );

//         const payment = mp.data;

//         console.log("STATUS PAGAMENTO:", payment.status);

//         if (payment.status !== "approved") {
//             return res.sendStatus(200);
//         }

//         const [rows] = await db.query(
//             "SELECT * FROM orders WHERE txid = ?",
//             [payment_id]
//         );

//         const order = rows[0];

//         if (!order) {
//             console.log("ORDER NÃO ENCONTRADO");
//             return res.sendStatus(200);
//         }

//         if (order.status !== "pending") {
//             console.log("ORDER JÁ PROCESSADO");
//             return res.sendStatus(200);
//         }

//         const api = new Api();

//         const result = await api.order({
//             service: 1284,
//             link: order.link,
//             quantity: order.quantity
//         });

//         console.log("RESPOSTA API:", result);

//         // 🔥 MELHOR DETECÇÃO DE ERRO
//         if (!result || !result.order) {
//             await db.query(
//                 "UPDATE orders SET status='error', response=? WHERE id=?",
//                 [JSON.stringify(result), order.id]
//             );

//             console.log("ERRO NA API DE ENTREGA");
//             return res.sendStatus(200);
//         }

//         await db.query(
//             `UPDATE orders 
//              SET status='processing', external_id=? 
//              WHERE id=?`,
//             [result.order, order.id]
//         );

//         console.log("PEDIDO PROCESSADO COM SUCESSO");

//         return res.sendStatus(200);

//     } catch (err) {
//         console.error("ERRO WEBHOOK:", err.message);

//         return res.sendStatus(200);
//     }
// });

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log("Webhook rodando na porta " + PORT);
// });

const express = require("express");
const axios = require("axios");
const db = require("./database");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
    try {
         console.log("WEBHOOK RECEBIDO:", req.body);
        const payment_id = req.body?.data?.id;
        if (!payment_id) return res.sendStatus(200);

        const token = process.env.MP_TOKEN_PRD;

        const mp = await axios.get(
            `https://api.mercadopago.com/v1/payments/${payment_id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 10000
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
    const [orders] = await db.query(
        "SELECT * FROM orders WHERE status='queued' LIMIT 5"
    );

    for (const order of orders) {

        await db.query(
            "UPDATE orders SET status='processing' WHERE id=? AND status='queued'",
            [order.id]
        );

        const api = new Api();

        try {
            const result = await api.order({
                service: 1,
                link: order.link,
                quantity: order.quantity
            });

            if (result?.order) {
                await db.query(
                    "UPDATE orders SET status='completed', external_id=? WHERE id=?",
                    [result.order, order.id]
                );
            } else {
                await db.query(
                    "UPDATE orders SET status='error' WHERE id=?",
                    [order.id]
                );
            }

        } catch (err) {
            console.log("WORKER ERROR:", err.message);

            await db.query(
                "UPDATE orders SET status='error' WHERE id=?",
                [order.id]
            );
        }
    }
}

setInterval(processOrders, 10000);
