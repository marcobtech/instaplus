const db = require("./database");
const Api = require("./api");

async function processOrders() {
    try {
        const [orders] = await db.query(
            "SELECT * FROM orders WHERE status='queued' LIMIT 10"
        );

        for (const order of orders) {

            // 🔥 trava processamento
            await db.query(
                "UPDATE orders SET status='processing' WHERE id=? AND status='queued'",
                [order.id]
            );

            const api = new Api();

            let result;

            try {
                result = await api.order({
                    service: 1284, // depois você pode trocar por dinâmico
                    link: order.link,
                    quantity: order.quantity
                });
            } catch (err) {
                console.log("API ERROR:", err.message);

                await db.query(
                    "UPDATE orders SET status='error' WHERE id=?",
                    [order.id]
                );

                continue;
            }

            console.log("API RESPONSE:", result);

            if (!result || !result.order) {
                await db.query(
                    "UPDATE orders SET status='error' WHERE id=?",
                    [order.id]
                );
                continue;
            }

            await db.query(
                `UPDATE orders 
                 SET status='completed', external_id=? 
                 WHERE id=?`,
                [result.order, order.id]
            );
        }

    } catch (err) {
        console.log("WORKER ERROR:", err.message);
    }
}

// 🔥 roda a cada 10 segundos
setInterval(processOrders, 10000);

console.log("Worker iniciado...");
