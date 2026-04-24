const axios = require("axios");

class Api {
    constructor() {
        this.api_url = "https://painelpro.net/api/v2";
        this.api_key = process.env.PP_TOKEN;
    }

    async request(data) {
        try {
            const payload = new URLSearchParams({
                key: this.api_key,
                ...data
            });

            const res = await axios.post(this.api_url, payload, {
                timeout: 10000
            });

            return res.data;

        } catch (err) {
            console.log("💥 ERRO API:", err.message);
            return null;
        }
    }

    async order(data) {
        return this.request({
            action: "add",
            ...data
        });
    }

    async status(orderId) {
        return this.request({
            action: "status",
            order: orderId
        });
    }

    async multiStatus(orderIds) {
        return this.request({
            action: "status",
            orders: orderIds.join(",")
        });
    }

    async balance() {
        return this.request({
            action: "balance"
        });
    }
}

module.exports = Api;
