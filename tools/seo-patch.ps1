$file = "c:\Site Manon\opanoma-fresh\index.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$apo = [char]0x2019
$oe = [char]0x0152

# Old block: from <title> to <script type="module"...> (inclusive)
$oldBlock = @"
  <title>Accueil - l${apo}${oe}il d${apo}Opanoma</title>
  <meta name="description" content="L${apo}${oe}il d${apo}Opanoma $([char]0x2014) Guidance spirituelle personnalis${([char]0x00E9)}e. Consultations de tarot, pendule et alignement ${([char]0x00E9)}nerg${([char]0x00E9)}tique. Tirage en ligne gratuit avec interpr${([char]0x00E9)}tation.">
  <meta property="og:title" content="L${apo}${oe}il d${apo}Opanoma $([char]0x2014) Guidance Spirituelle">
  <meta property="og:description" content="Consultations de tarot, pendule et alignement ${([char]0x00E9)}nerg${([char]0x00E9)}tique. Tirage en ligne gratuit avec interpr${([char]0x00E9)}tation par intelligence artificielle.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://opanoma.fr/">
  <meta property="og:image" content="https://opanoma.fr/img/opalogo.png">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary">
  <script type="module" src="/src/main.js"></script>
"@

Write-Host "Old block found: $($content.Contains($oldBlock))"
if (-not $content.Contains($oldBlock)) {
    Write-Host "ERROR: Could not find old block. Aborting."
    exit 1
}

$newBlock = @"
  <title>L${apo}${oe}il d${apo}Opanoma $([char]0x2014) Tarot, Pendule & Guidance Spirituelle | Tirage Gratuit en Ligne</title>
  <meta name="description" content="L${apo}${oe}il d${apo}Opanoma $([char]0x2014) Guidance spirituelle personnalis${([char]0x00E9)}e par Manon. Consultations de tarot, pendule et alignement ${([char]0x00E9)}nerg${([char]0x00E9)}tique. Tirage en ligne gratuit avec interpr${([char]0x00E9)}tation par IA.">
  <link rel="canonical" href="https://opanoma.fr/">
  <meta property="og:title" content="L${apo}${oe}il d${apo}Opanoma $([char]0x2014) Tarot, Pendule & Guidance Spirituelle">
  <meta property="og:description" content="Consultations de tarot, pendule et alignement ${([char]0x00E9)}nerg${([char]0x00E9)}tique. Tirage en ligne gratuit avec interpr${([char]0x00E9)}tation par intelligence artificielle.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://opanoma.fr/">
  <meta property="og:image" content="https://opanoma.fr/img/opalogo.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="L${apo}${oe}il d${apo}Opanoma">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="L${apo}${oe}il d${apo}Opanoma $([char]0x2014) Tarot, Pendule & Guidance Spirituelle">
  <meta name="twitter:description" content="Guidance spirituelle personnalis${([char]0x00E9)}e. Tirage de tarot gratuit en ligne avec interpr${([char]0x00E9)}tation par IA.">
  <meta name="twitter:image" content="https://opanoma.fr/img/opalogo.png">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#1a0a2e">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://opanoma.fr/#business",
        "name": "L'${oe}il d'Opanoma",
        "description": "Guidance spirituelle personnalis${([char]0x00E9)}e - Tarot, Pendule & Alignement ${([char]0x00E9)}nerg${([char]0x00E9)}tique",
        "url": "https://opanoma.fr",
        "image": "https://opanoma.fr/img/opalogo.png",
        "priceRange": "${([char]0x20AC)}${([char]0x20AC)}",
        "areaServed": {"@type": "Country", "name": "France"},
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Consultations",
          "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Tirage Express - 3 Cartes", "description": "Guidance rapide et cibl${([char]0x00E9)}e sur une question pr${([char]0x00E9)}cise"}, "price": "30", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Exploration Compl${([char]0x00E8)}te - 10 Cartes", "description": "Lecture approfondie du chemin de vie"}, "price": "55", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Chemin de Vie - Croix Celtique", "description": "Analyse d${([char]0x00E9)}taill${([char]0x00E9)}e pass${([char]0x00E9)}-pr${([char]0x00E9)}sent-futur"}, "price": "75", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Recherche Pendulaire", "description": "R${([char]0x00E9)}ponses par le pendule sur vos interrogations"}, "price": "40", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Bilan ${([char]0x00C9)}nerg${([char]0x00E9)}tique", "description": "Analyse de vos centres ${([char]0x00E9)}nerg${([char]0x00E9)}tiques"}, "price": "50", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Harmonisation Compl${([char]0x00E8)}te", "description": "Tirage + Pendule + Bilan ${([char]0x00E9)}nerg${([char]0x00E9)}tique"}, "price": "110", "priceCurrency": "EUR"}
          ]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://opanoma.fr/#website",
        "name": "L'${oe}il d'Opanoma",
        "url": "https://opanoma.fr"
      },
      {
        "@type": "WebApplication",
        "name": "Tirage de Tarot Gratuit - L'${oe}il d'Opanoma",
        "url": "https://opanoma.fr",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
        "description": "Tirage de tarot interactif gratuit avec interpr${([char]0x00E9)}tation personnalis${([char]0x00E9)}e par intelligence artificielle"
      }
    ]
  }
  </script>
  <script type="module" src="/src/main.js"></script>
"@

$content = $content.Replace($oldBlock, $newBlock)
[System.IO.File]::WriteAllText($file, $content, (New-Object System.Text.UTF8Encoding $true))
Write-Host "SEO meta tags updated successfully."
