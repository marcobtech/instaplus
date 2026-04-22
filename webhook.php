<?php
require 'database.php';
require 'Api.php';

$data = json_decode(file_get_contents("php://input"), true);
$payment_id = $data['data']['id'] ?? null;

if(!$payment_id) exit;

$token = getenv("MP_TOKEN");

$ch = curl_init("https://api.mercadopago.com/v1/payments/$payment_id");

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $token"
]);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);

if($response['status'] != 'approved') exit;

$stmt = $pdo->prepare("SELECT * FROM orders WHERE txid=?");
$stmt->execute([$payment_id]);
$order = $stmt->fetch();

if(!$order || $order['status']!='pending') exit;

// 🔥 SUA API
$api = new Api();

$result = $api->order([
    'service' => 1,
    'link' => $order['link'],
    'quantity' => $order['quantity']
]);

if(!isset($result->order)){
    $pdo->prepare("UPDATE orders SET status='error' WHERE id=?")
    ->execute([$order['id']]);
    exit;
}

$pdo->prepare("
UPDATE orders SET status='processing', external_id=?
WHERE id=?
")->execute([$result->order, $order['id']]);
