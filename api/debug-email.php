<?php
// Script de diagnostic pour l'envoi d'emails
echo "<h1>Diagnostic Email Opanoma</h1>";

// 1. Vérifier les extensions PHP
echo "<h2>1. Extensions PHP</h2>";
echo "mail() function available: " . (function_exists('mail') ? "✅ OUI" : "❌ NON") . "<br>";
echo "curl extension: " . (extension_loaded('curl') ? "✅ OUI" : "❌ NON") . "<br>";
echo "json extension: " . (extension_loaded('json') ? "✅ OUI" : "❌ NON") . "<br>";

// 2. Configuration PHP
echo "<h2>2. Configuration PHP</h2>";
echo "SMTP: " . ini_get('SMTP') . "<br>";
echo "smtp_port: " . ini_get('smtp_port') . "<br>";
echo "sendmail_from: " . ini_get('sendmail_from') . "<br>";

// 3. Test de requête POST simple
echo "<h2>3. Test API</h2>";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo "✅ Requête POST reçue<br>";
    
    $input = file_get_contents('php://input');
    echo "Données brutes reçues: " . htmlspecialchars($input) . "<br>";
    
    $data = json_decode($input, true);
    if ($data) {
        echo "✅ JSON décodé avec succès<br>";
        echo "Email: " . htmlspecialchars($data['email'] ?? 'non fourni') . "<br>";
        echo "Tirage: " . htmlspecialchars(substr($data['tirage'] ?? 'non fourni', 0, 50)) . "...<br>";
        echo "Cartes: " . htmlspecialchars(implode(', ', $data['cartes'] ?? [])) . "<br>";
        
        // Test d'envoi d'email simple
        $to = $data['email'] ?? 'test@example.com';
        $subject = "Test Email Opanoma";
        $message = "Ceci est un test d'envoi d'email depuis Opanoma.";
        $headers = "From: noreply@opanoma.com";
        
        $result = mail($to, $subject, $message, $headers);
        echo "Résultat mail(): " . ($result ? "✅ SUCCÈS" : "❌ ÉCHEC") . "<br>";
        
        if (!$result) {
            echo "Erreur possible: vérifiez la configuration SMTP dans php.ini<br>";
        }
        
    } else {
        echo "❌ Erreur de décodage JSON: " . json_last_error_msg() . "<br>";
    }
} else {
    echo "Aucune requête POST reçue<br>";
}

// 4. Test de permissions de fichier
echo "<h2>4. Permissions</h2>";
$logFile = __DIR__ . '/email-log.txt';
if (is_writable(dirname($logFile))) {
    echo "✅ Répertoire accessible en écriture<br>";
} else {
    echo "❌ Répertoire non accessible en écriture<br>";
}

// 5. Formulaire de test intégré
echo "<h2>5. Test Direct</h2>";
?>
<form method="POST" style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
    <input type="hidden" name="test_direct" value="1">
    <label>Email: <input type="email" name="email" value="test@example.com" required></label><br><br>
    <label>Message: <textarea name="message">Test depuis le diagnostic</textarea></label><br><br>
    <button type="submit">Test Direct PHP mail()</button>
</form>

<?php
if (isset($_POST['test_direct'])) {
    $email = $_POST['email'];
    $message = $_POST['message'];
    $result = mail($email, "Test Direct Opanoma", $message, "From: noreply@opanoma.com");
    echo "<div style='background: " . ($result ? "#d4edda" : "#f8d7da") . "; padding: 10px; margin: 10px 0;'>";
    echo "Test direct: " . ($result ? "✅ SUCCÈS" : "❌ ÉCHEC");
    echo "</div>";
}

echo "<h2>6. Logs PHP</h2>";
echo "Pour voir les erreurs PHP, vérifiez le fichier de log XAMPP dans:<br>";
echo "C:\\xampp\\apache\\logs\\error.log<br>";
?>