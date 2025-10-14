<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../scripts/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $email = strtolower(trim($input['email']));
    $firstName = isset($input['firstName']) ? trim($input['firstName']) : '';
    $unsubscribeToken = bin2hex(random_bytes(32));
    
    // Vérifier si déjà inscrit
    $stmt = $db->prepare("SELECT id, is_active FROM newsletter_subscribers WHERE email = ?");
    $stmt->execute([$email]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        if ($existing['is_active']) {
            echo json_encode(['message' => 'Vous êtes déjà inscrit à notre newsletter !']);
            exit;
        } else {
            // Réactiver l'abonnement
            $stmt = $db->prepare("UPDATE newsletter_subscribers SET is_active = 1, subscribed_at = NOW() WHERE email = ?");
            $stmt->execute([$email]);
            echo json_encode(['message' => 'Votre abonnement a été réactivé avec succès !']);
            exit;
        }
    }
    
    // Nouvelle inscription
    $stmt = $db->prepare("
        INSERT INTO newsletter_subscribers (email, first_name, unsubscribe_token) 
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$email, $firstName, $unsubscribeToken]);
    
    // Optionnel: Ajouter aussi à MailerLite
    addToMailerLite($email, $firstName);
    
    echo json_encode(['message' => 'Inscription réussie ! Vous recevrez votre première carte cette semaine.']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur: ' . $e->getMessage()]);
}

function addToMailerLite($email, $firstName) {
    if (!isset($_ENV['MAILERLITE_API_KEY'])) return;
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.mailerlite.com/api/v2/groups/' . $_ENV['MAILERLITE_GROUP_ID'] . '/subscribers',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'X-MailerLite-ApiKey: ' . $_ENV['MAILERLITE_API_KEY'],
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'email' => $email,
            'name' => $firstName,
            'resubscribe' => true
        ])
    ]);
    
    curl_exec($curl);
    curl_close($curl);
}
?>