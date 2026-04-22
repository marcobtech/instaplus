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

        const res = await axios.post(this.api_url, new URLSearchParams(payload));
        return res.data;
    }

    async status(order_id) {
        const payload = {
            key: this.api_key,
            action: "status",
            order: order_id
        };

        const res = await axios.post(this.api_url, new URLSearchParams(payload));
        return res.data;
    }
}

module.exports = Api;