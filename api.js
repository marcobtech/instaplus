const axios = require("axios");

class Api {
    constructor() {
        this.api_url = "https://painelpro.net/api/v2";
        this.api_key = process.env.PP_TOKEN;
    }

    async request(data) {
        const payload = {
            key: this.api_key,
            ...data
        };

        const res = await axios.post(
            this.api_url,
            new URLSearchParams(payload),
            { timeout: 10000 }
        );

        return res.data;
    }

    // 🚀 CRIAR PEDIDO
    async order(data) {
        return await this.request({
            action: "add",
            ...data
        });
    }

    // 🔍 STATUS DE UM PEDIDO
    async status(orderId) {
        return await this.request({
            action: "status",
            order: orderId
        });
    }

    // 🔍 STATUS DE VÁRIOS (OTIMIZAÇÃO FUTURA)
    async multiStatus(orderIds) {
        return await this.request({
            action: "status",
            orders: orderIds.join(",")
        });
    }
}

module.exports = Api;
