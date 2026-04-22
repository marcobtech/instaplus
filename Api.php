<?php
class Api
{
    public $api_url = 'https://painelpro.net/api/v2';
    public $api_key = getenv("PP_TOKEN");

    public function order($data)
    {
        $post = array_merge(['key' => $this->api_key, 'action' => 'add'], $data);
        return json_decode((string)$this->connect($post));
    }

    public function status($order_id)
    {
        return json_decode($this->connect([
            'key' => $this->api_key,
            'action' => 'status',
            'order' => $order_id
        ]));
    }

    private function connect($post)
    {
        $_post = [];
        foreach ($post as $name => $value) {
            $_post[] = $name . '=' . urlencode($value);
        }

        $ch = curl_init($this->api_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, join('&', $_post));
        return curl_exec($ch);
    }
}
