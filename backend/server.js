const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Handles web requests to Google

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const ACCESS_KEY = "adventure2026"; 

// 🎯 PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyDmns-p0nHFeVrktpK13Iuzu_C9-OSISOs3EJwOpP1v8u9AyI7nbB3RH3-oQtj16HLg/exec';

app.post('/api/login', async (req, res) => {
  const { key, username } = req.body;

  if (key === ACCESS_KEY) {
    const userIdentifier = username ? username.trim() : "Anonymous Friend";
    
    // 🇮🇳 Calculate exact IST 
    const now = new Date();
    const istTimeInstance = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const istString = istTimeInstance.toISOString().replace('Z', '');
    const [istDate, rawTime] = istString.split('T');
    const istTimeFormatted = rawTime.split('.')[0]; 

    try {
      // Direct post request straight to your Google Sheet macro with forced redirect handling
      const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow', // 🚀 FORCES NODE TO FOLLOW GOOGLE'S REDIRECT
        body: JSON.stringify({
          username: userIdentifier,
          date: istDate,
          time: istTimeFormatted
        })
      });

      const responseText = await googleResponse.text();
      console.log(`☁️ Synced straight to Google Sheet Macro. Response: ${responseText}`);
      return res.status(200).json({ success: true, message: "Access granted!" });

    } catch (error) {
      console.error('❌ Cloud Sync Failed:', error);
      return res.status(200).json({ success: true, message: "Access granted (Offline Mode)" });
    }
  } else {
    return res.status(401).json({ success: false, message: "Invalid Access Key!" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server bypass running on http://localhost:${PORT}`);
});