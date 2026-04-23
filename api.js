const axios = require("axios");

class Api {
    constructor() {
        this.api_url = "https://painelpro.net/api/v2";
        this.api_key = process.env.PP_TOKEN;
    }

    async order(data) {
        const payload = {
            key: this.api_key,
            action: "add",
            ...data
        };

        try {
            const res = await axios.post(
                this.api_url,
                new URLSearchParams(payload),
                {
                    timeout: 10000 // 🔥 evita ETIMEDOUT
                }
            );

            return res.data;

        } catch (err) {
            console.log("API ORDER ERROR:", err.message);

            return {
                error: true,
                message: err.message
            };
        }
    }

    async status(order_id) {
        const payload = {
            key: this.api_key,
            action: "status",
            order: order_id
        };

        try {
            const res = await axios.post(
                this.api_url,
                new URLSearchParams(payload),
                {
                    timeout: 10000
                }
            );

            return res.data;

        } catch (err) {
            console.log("API STATUS ERROR:", err.message);

            return {
                error: true,
                message: err.message
            };
        }
    }
}

module.exports = Api;
