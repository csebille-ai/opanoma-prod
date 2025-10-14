<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Activer l'affichage des erreurs pour debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Vérifier que la méthode est POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée');
    }

    // Récupérer les données JSON
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Données JSON invalides: ' . json_last_error_msg());
    }

    $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $tirageContent = $data['tirage'] ?? '';
    $cartes = $data['cartes'] ?? [];

    if (!$email) {
        throw new Exception('Email invalide');
    }

    if (empty($tirageContent)) {
        throw new Exception('Contenu du tirage manquant');
    }

    // Créer un identifiant unique pour ce tirage
    $tirageId = 'tirage_' . date('Y-m-d_H-i-s') . '_' . substr(md5($email), 0, 8);
    
    // Créer le répertoire des tirages s'il n'existe pas
    $tiragesDir = __DIR__ . '/tirages';
    if (!is_dir($tiragesDir)) {
        mkdir($tiragesDir, 0755, true);
    }

    // Sauvegarder le tirage en fichier HTML
    $htmlContent = "
<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Tirage de Tarot - Opanoma</title>
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
        .print-btn {
            background: #1a237e;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class='header'>
        <div class='logo'>🔮 OPANOMA</div>
        <div class='subtitle'>Votre tirage de tarot personnalisé</div>
        <div style='margin-top: 15px; font-size: 14px;'>Généré le " . date('d/m/Y à H:i') . "</div>
    </div>
    
    <div class='content'>
        <h2>Bonjour,</h2>
        
        <p>Voici votre tirage de tarot personnalisé réalisé par notre intelligence artificielle spécialisée en tarologie.</p>
        
        <p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>
        
        " . (!empty($cartes) ? "
        <div class='cards-section'>
            <h3>🃏 Vos cartes tirées :</h3>
            " . implode('', array_map(function($carte) {
                return "<span class='card-item'>" . htmlspecialchars($carte) . "</span>";
            }, $cartes)) . "
        </div>
        " : "") . "
        
        <div class='tirage-section'>
            <h3>✨ Votre interprétation :</h3>
            <div class='interpretation'>" . nl2br(htmlspecialchars($tirageContent)) . "</div>
        </div>
        
        <p>Cette interprétation a été générée spécialement pour vous en tenant compte de l'énergie du moment et de la symbolique des cartes tirées.</p>
        
        <p class='signature'>Bien à vous,<br>Madame IA.RMA<br>Voyante digitale - Opanoma</p>
        
        <button class='print-btn' onclick='window.print()'>🖨️ Imprimer ce tirage</button>
    </div>
    
    <div class='footer'>
        <p>Ce tirage vous a été généré depuis <strong>Opanoma</strong><br>
        ID du tirage: <code>$tirageId</code></p>
        <p><em>Merci de votre confiance ✨</em></p>
    </div>
</body>
</html>
    ";

    // Sauvegarder le fichier HTML
    $htmlFile = $tiragesDir . '/' . $tirageId . '.html';
    file_put_contents($htmlFile, $htmlContent);

    // Essayer d'envoyer l'email
    $emailSent = false;
    $emailError = '';
    
    try {
        // Configuration email basique
        $to = $email;
        $subject = "🔮 Votre tirage de tarot personnalisé - Opanoma";
        
        // Message simple avec lien vers le tirage
        $message = "
Bonjour,

Votre tirage de tarot personnalisé est prêt !

🃏 Cartes tirées: " . implode(', ', $cartes) . "

Vous pouvez consulter votre tirage complet à l'adresse suivante:
http://localhost/opanoma-fresh/api/tirages/$tirageId.html

Cette interprétation a été générée spécialement pour vous par notre IA spécialisée en tarologie.

Bien à vous,
Madame IA.RMA
Voyante digitale - Opanoma

---
ID du tirage: $tirageId
Généré le " . date('d/m/Y à H:i') . "
        ";

        $headers = array(
            'From: Madame IA.RMA <noreply@opanoma.com>',
            'Reply-To: contact@opanoma.com',
            'Content-Type: text/plain; charset=UTF-8'
        );

        $emailSent = mail($to, $subject, $message, implode("\r\n", $headers));
        
        if (!$emailSent) {
            $emailError = 'Fonction mail() a échoué';
        }
        
    } catch (Exception $e) {
        $emailError = $e->getMessage();
    }

    // Log de l'opération
    $logEntry = date('Y-m-d H:i:s') . " - Email: $email - Tirage: $tirageId - Email envoyé: " . ($emailSent ? "OUI" : "NON ($emailError)") . "\n";
    file_put_contents($tiragesDir . '/email-log.txt', $logEntry, FILE_APPEND | LOCK_EX);

    // Réponse de succès (même si l'email a échoué, le tirage est sauvegardé)
    $response = [
        'success' => true,
        'message' => 'Tirage sauvegardé avec succès',
        'tirage_id' => $tirageId,
        'html_url' => "http://localhost/opanoma-fresh/api/tirages/$tirageId.html"
    ];
    
    if ($emailSent) {
        $response['email_sent'] = true;
        $response['message'] = 'Email envoyé et tirage sauvegardé avec succès';
    } else {
        $response['email_sent'] = false;
        $response['email_error'] = $emailError;
        $response['message'] = 'Tirage sauvegardé. Email non envoyé: ' . $emailError;
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'success' => false
    ]);
}
?>