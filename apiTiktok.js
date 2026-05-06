const axios = require("axios");

class ApiTiktok {
    constructor() {
        this.api_url = "https://morethanpanel.com/api/v2";
        this.api_key = process.env.TT_TOKEN; // 🔥 novo token
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
            console.log("💥 ERRO API TIKTOK:", err.message);
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
}

module.exports = ApiTiktok;
