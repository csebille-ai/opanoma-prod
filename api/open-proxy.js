const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const MailerLite = require('@mailerlite/mailerlite-nodejs').default;
const app = express();
app.use(express.json());


require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;

const mailerlite = new MailerLite({ api_key: MAILERLITE_API_KEY });

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/api/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const params = {
    email: email,
    groups: [MAILERLITE_GROUP_ID],
    status: 'active',
  };

  try {
    console.log(`Tentative d'inscription de ${email} au groupe ${MAILERLITE_GROUP_ID}`);
    const response = await mailerlite.subscribers.createOrUpdate(params);
    console.log('Réponse de MailerLite:', response.data);
    res.status(200).json({ success: true, message: 'Inscription réussie !' });
  } catch (error) {
    console.error('Erreur MailerLite:', error.response.data);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription.', error: error.response.data });
  }
});

app.post('/api/open-proxy', async (req, res) => {
  console.log("req.body =", req.body);
  const { cartes, theme, question } = req.body;
  const prompt = `
Tu es une tarologue experte, pédagogue et bienveillante.
Voici un tirage de tarot sur le thème "${theme}" avec les cartes suivantes : ${cartes.join(', ')}.
${question ? "La question posée est : " + question + "." : "Aucune question précise n'a été posée."}
Donne une interprétation synthétique, nuancée et positive, en français, en 5 à 10 lignes maximum.
Utilise un langage clair, accessible, et termine par un conseil pratique.
`;

  try {
    const body = {
      model: "gpt-4o-mini",
      messages: [{role: "user", content: prompt}],
      max_completion_tokens: 600
    };
    console.log("Body envoyé à OpenAI :", body); // <-- AJOUTE CETTE LIGNE

    console.log("Envoi requête à OpenAI...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });
    console.log("Réponse reçue d'OpenAI, parsing JSON...");
    const data = await response.json();
    console.log("Réponse OpenAI brute :", data);
    if (!response.ok) {
      console.error(data);
      return res.status(500).json({ result: "Erreur OpenAI : " + (data.error?.message || "inconnue") });
    }

    // Après avoir reçu la data
    console.log("Message complet :", data.choices[0].message);

    let resultText = "";
    if (data.choices && data.choices[0] && data.choices[0].message) {
      // Pour la plupart des modèles, c'est .content
      resultText = data.choices[0].message.content || JSON.stringify(data.choices[0].message);
    } else {
      resultText = "Erreur d'interprétation.";
    }
    res.json({ result: resultText });
  } catch (e) {
    console.error("Erreur attrapée dans le catch :", e);
    res.status(500).json({ result: "Erreur lors de la connexion à OpenAI." });
  }
});

app.listen(3000, () => console.log('Serveur proxy OpenAI sur http://localhost:3000'));

