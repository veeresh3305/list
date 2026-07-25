const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server binding express app
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json()); // Built-in alternative to body-parser

// --- Attach Socket Handlers ---
// (paths fixed: these live in Games/ and Drawing/, not directly in backend/)
const handleWordleSockets = require('./Games/wordleSocket');
const handleDrawSockets = require('./Drawing/drawSocket');
const handleAnagramSockets = require('./Games/anagramSocket');
const { router: truthOrDareRouter, handleTruthOrDareSockets } = require('./Games/truthordareSocket');
const wordsearchRouter = require('./Games/wordsearchSocket');
const handleQuizSockets = require('./Games/quizSocket');
const handleUnoSockets = require('./Games/unoSocket');
const handleRateItSockets = require('./Games/rateitSocket');
const handleWouldYouRatherSockets = require('./Games/wouldyourratherSocket');

handleWordleSockets(io);
handleDrawSockets(io);
handleAnagramSockets(io);
handleTruthOrDareSockets(io);
handleQuizSockets(io);
handleUnoSockets(io);
handleRateItSockets(io);
handleWouldYouRatherSockets(io);

// --- Attach REST Routers ---
app.use(truthOrDareRouter);
app.use(wordsearchRouter);

const ACCESS_KEY = "trial";
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyDmns-p0nHFeVrktpK13Iuzu_C9-OSISOs3EJwOpP1v8u9AyI7nbB3RH3-oQtj16HLg/exec';

// API Routes
app.post('/api/login', async (req, res) => {
  const { key, username } = req.body;

  if (key === ACCESS_KEY) {
    const userIdentifier = username ? username.trim() : "Anonymous Friend";

    // Accurate IST Formatting
    const now = new Date();
    const istDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    const istTimeFormatted = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }); // HH:MM:SS

    try {
      const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
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

// IMPORTANT: Use server.listen instead of app.listen for Socket.io
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});