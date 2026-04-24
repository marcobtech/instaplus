const express = require("express");
const db = require("./database");
const Api = require("./api");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Worker rodando na porta " + PORT);
});

/**
 * 🔥 ENVIA PEDIDOS (FILA COM CONTROLE POR PERFIL)
 */
async function processOrders() {
    console.log("📤 Processando fila...");

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

    console.log(`📦 ${orders.length} pedidos prontos para envio`);

    for (const order of orders) {

        console.log(`➡️ Enviando pedido ${order.id} (${order.link})`);

        // 🔒 trava anti concorrência
        const [update] = await db.query(
            "UPDATE orders SET status='processing' WHERE id=? AND status='queued'",
            [order.id]
        );

        if (update.affectedRows === 0) {
            console.log("⚠️ Pedido já processado por outro worker");
            continue;
        }

        const api = new Api();

        try {
            const result = await api.order({
                service: 1289,
                link: order.link,
                quantity: order.quantity
            });

            console.log("📨 RESPOSTA API:", result);

            if (result?.order) {

                await db.query(
                    "UPDATE orders SET external_id=?, status='processing' WHERE id=?",
                    [result.order, order.id]
                );

                console.log(`✅ Pedido ${order.id} enviado → external_id ${result.order}`);

            } else {

                await db.query(
                    "UPDATE orders SET status='error', response=? WHERE id=?",
                    [JSON.stringify(result), order.id]
                );

                console.log(`❌ Erro API pedido ${order.id}`);
            }

        } catch (err) {

            await db.query(
                "UPDATE orders SET status='error', response=? WHERE id=?",
                [err.message, order.id]
            );

            console.log(`💥 ERRO envio pedido ${order.id}:`, err.message);
        }
    }
}

/**
 * 🔍 VERIFICA STATUS NO FORNECEDOR
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
        console.log("😴 Nenhum pedido em processamento");
        return;
    }

    const api = new Api();

    for (const order of orders) {

        try {
            const res = await api.status(order.external_id);

            if (!res || !res.status) {
                console.log(`⚠️ Sem resposta válida pedido ${order.id}`);
                continue;
            }

            const status = res.status.toLowerCase();

            console.log(`📊 Pedido ${order.id} → ${status}`);

            // 🔄 AINDA PROCESSANDO
            if (['pending', 'processing', 'in progress'].includes(status)) {
                continue;
            }

            // ✅ FINALIZADO
            if (status === 'completed') {

                await db.query(
                    "UPDATE orders SET status='completed' WHERE id=?",
                    [order.id]
                );

                console.log(`🎉 Pedido ${order.id} FINALIZADO`);
            }

            // ⚠️ PARCIAL (você pode decidir tratar diferente)
            else if (status === 'partial') {

                await db.query(
                    "UPDATE orders SET status='partial' WHERE id=?",
                    [order.id]
                );

                console.log(`⚠️ Pedido ${order.id} PARCIAL`);
            }

            // ❌ CANCELADO
            else if (['canceled', 'cancelled'].includes(status)) {

                await db.query(
                    "UPDATE orders SET status='canceled' WHERE id=?",
                    [order.id]
                );

                console.log(`❌ Pedido ${order.id} CANCELADO`);
            }

        } catch (err) {
            console.log(`💥 ERRO status ${order.id}:`, err.message);
        }
    }
}

/**
 * 🔁 LOOP PRINCIPAL
 */
async function loop() {
    try {
        console.log("\n🔁 =============================");

        await processOrders();     // envia novos pedidos
        await checkOrderStatus();  // atualiza status

    } catch (err) {
        console.log("💥 ERRO GERAL:", err.message);
    }

    setTimeout(loop, 10000); // roda a cada 10s
}

loop();
