const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(file, 'utf8');

// Find the block from <title> to <script type="module" src="/src/main.js"></script>
const startMarker = '  <title>Accueil';
const endMarker = '<script type="module" src="/src/main.js"></script>';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx) + endMarker.length;

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find markers');
    process.exit(1);
}

const oldBlock = content.substring(startIdx, endIdx);
console.log('Found old block (' + oldBlock.length + ' chars):');
console.log(oldBlock.substring(0, 100) + '...');

const newBlock = `  <title>L\u2019\u0152il d\u2019Opanoma \u2014 Tarot, Pendule & Guidance Spirituelle | Tirage Gratuit en Ligne</title>
  <meta name="description" content="L\u2019\u0152il d\u2019Opanoma \u2014 Guidance spirituelle personnalis\u00e9e par Manon. Consultations de tarot, pendule et alignement \u00e9nerg\u00e9tique. Tirage en ligne gratuit avec interpr\u00e9tation par IA.">
  <link rel="canonical" href="https://opanoma.fr/">
  <meta property="og:title" content="L\u2019\u0152il d\u2019Opanoma \u2014 Tarot, Pendule & Guidance Spirituelle">
  <meta property="og:description" content="Consultations de tarot, pendule et alignement \u00e9nerg\u00e9tique. Tirage en ligne gratuit avec interpr\u00e9tation par intelligence artificielle.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://opanoma.fr/">
  <meta property="og:image" content="https://opanoma.fr/img/opalogo.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="L\u2019\u0152il d\u2019Opanoma">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="L\u2019\u0152il d\u2019Opanoma \u2014 Tarot, Pendule & Guidance Spirituelle">
  <meta name="twitter:description" content="Guidance spirituelle personnalis\u00e9e. Tirage de tarot gratuit en ligne avec interpr\u00e9tation par IA.">
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
        "name": "L'\u0152il d'Opanoma",
        "description": "Guidance spirituelle personnalis\u00e9e - Tarot, Pendule & Alignement \u00e9nerg\u00e9tique",
        "url": "https://opanoma.fr",
        "image": "https://opanoma.fr/img/opalogo.png",
        "priceRange": "\u20ac\u20ac",
        "areaServed": {"@type": "Country", "name": "France"},
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Consultations",
          "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Tirage Express - 3 Cartes", "description": "Guidance rapide et cibl\u00e9e sur une question pr\u00e9cise"}, "price": "30", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Exploration Compl\u00e8te - 10 Cartes", "description": "Lecture approfondie du chemin de vie"}, "price": "55", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Chemin de Vie - Croix Celtique", "description": "Analyse d\u00e9taill\u00e9e pass\u00e9-pr\u00e9sent-futur"}, "price": "75", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Recherche Pendulaire", "description": "R\u00e9ponses par le pendule sur vos interrogations"}, "price": "40", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Bilan \u00c9nerg\u00e9tique", "description": "Analyse de vos centres \u00e9nerg\u00e9tiques"}, "price": "50", "priceCurrency": "EUR"},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Harmonisation Compl\u00e8te", "description": "Tirage + Pendule + Bilan \u00e9nerg\u00e9tique"}, "price": "110", "priceCurrency": "EUR"}
          ]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://opanoma.fr/#website",
        "name": "L'\u0152il d'Opanoma",
        "url": "https://opanoma.fr"
      },
      {
        "@type": "WebApplication",
        "name": "Tirage de Tarot Gratuit - L'\u0152il d'Opanoma",
        "url": "https://opanoma.fr",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
        "description": "Tirage de tarot interactif gratuit avec interpr\u00e9tation personnalis\u00e9e par intelligence artificielle"
      }
    ]
  }
  </script>
  <script type="module" src="/src/main.js"></script>`;

content = content.replace(oldBlock, newBlock);

// Write back with BOM
const bom = '\uFEFF';
if (!content.startsWith(bom)) {
    content = bom + content;
}
fs.writeFileSync(file, content, 'utf8');
console.log('SEO meta tags updated successfully!');
