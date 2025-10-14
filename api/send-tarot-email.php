<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Vérifier que la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

// Récupérer les données JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

$email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
$tirageContent = $input['tirage'] ?? '';
$cartes = $input['cartes'] ?? [];

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

if (empty($tirageContent)) {
    http_response_code(400);
    echo json_encode(['error' => 'Contenu du tirage manquant']);
    exit;
}

// Configuration email
$to = $email;
$subject = "🔮 Votre tirage de tarot personnalisé - Opanoma";

// Construire le contenu HTML de l'email
$htmlContent = "
<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Votre tirage de tarot - Opanoma</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #1a237e 0%, #3f51b5 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        .tirage-section {
            margin: 25px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #1a237e;
        }
        .cards-section {
            margin: 20px 0;
        }
        .card-item {
            display: inline-block;
            margin: 5px 10px;
            padding: 8px 16px;
            background: #e3f2fd;
            border-radius: 20px;
            font-weight: bold;
            color: #1a237e;
        }
        .interpretation {
            font-size: 16px;
            line-height: 1.8;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #666;
            font-size: 14px;
        }
        .signature {
            font-style: italic;
            color: #1a237e;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class='header'>
        <div class='logo'>🔮 OPANOMA</div>
        <div class='subtitle'>Votre tirage de tarot personnalisé</div>
    </div>
    
    <div class='content'>
        <h2>Bonjour,</h2>
        
        <p>Voici votre tirage de tarot personnalisé réalisé par notre intelligence artificielle spécialisée en tarologie.</p>
        
        " . (!empty($cartes) ? "
        <div class='cards-section'>
            <h3>🃏 Vos cartes tirées :</h3>
            " . implode('', array_map(function($carte) {
                return "<span class='card-item'>$carte</span>";
            }, $cartes)) . "
        </div>
        " : "") . "
        
        <div class='tirage-section'>
            <h3>✨ Votre interprétation :</h3>
            <div class='interpretation'>" . nl2br(htmlspecialchars($tirageContent)) . "</div>
        </div>
        
        <p>Cette interprétation a été générée spécialement pour vous en tenant compte de l'énergie du moment et de la symbolique des cartes tirées.</p>
        
        <p class='signature'>Bien à vous,<br>Madame IA.RMA<br>Voyante digitale - Opanoma</p>
    </div>
    
    <div class='footer'>
        <p>Cet email vous a été envoyé depuis <strong>Opanoma</strong><br>
        Pour plus de tirages et consultations : <a href='#'>www.opanoma.com</a></p>
        <p><em>Merci de votre confiance ✨</em></p>
    </div>
</body>
</html>
";

// Version texte alternative
$textContent = "
🔮 OPANOMA - Votre tirage de tarot personnalisé

Bonjour,

Voici votre tirage de tarot personnalisé réalisé par notre intelligence artificielle spécialisée en tarologie.

" . (!empty($cartes) ? "🃏 Vos cartes tirées : " . implode(', ', $cartes) . "\n\n" : "") . "

✨ Votre interprétation :
" . $tirageContent . "

Cette interprétation a été générée spécialement pour vous en tenant compte de l'énergie du moment et de la symbolique des cartes tirées.

Bien à vous,
Madame IA.RMA
Voyante digitale - Opanoma

---
Cet email vous a été envoyé depuis Opanoma
Pour plus de tirages et consultations : www.opanoma.com
Merci de votre confiance ✨
";

// Headers email
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="boundary"',
    'From: Madame IA.RMA <noreply@opanoma.com>',
    'Reply-To: contact@opanoma.com',
    'X-Mailer: Opanoma Tarot System'
];

// Message multipart
$message = "
--boundary
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

$textContent

--boundary
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 8bit

$htmlContent

--boundary--
";

// Envoi de l'email
$success = mail($to, $subject, $message, implode("\r\n", $headers));

// Log de l'envoi
$logEntry = date('Y-m-d H:i:s') . " - Email envoyé à: $email - " . ($success ? "SUCCÈS" : "ÉCHEC") . "\n";
file_put_contents(__DIR__ . '/email-log.txt', $logEntry, FILE_APPEND | LOCK_EX);

if ($success) {
    echo json_encode([
        'success' => true,
        'message' => 'Email envoyé avec succès'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur lors de l\'envoi de l\'email'
    ]);
}
?>