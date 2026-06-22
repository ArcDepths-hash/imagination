// --- RENDER FREE TIER KEEP-ALIVE ---
const http = require('http');
http.createServer((req, res) => res.end('Bot is online!')).listen(process.env.PORT || 3000);
console.log('🌐 Web listener initialized for Render free tier.');
// ------------------------------------
