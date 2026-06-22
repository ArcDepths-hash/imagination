// --- RENDER FREE TIER KEEP-ALIVE ---
const http = require('http');
http.createServer((req, res) => res.end('Master System Launcher Online!')).listen(process.env.PORT || 3000);
console.log('🌐 Web listener initialized for Render free tier.');
// ------------------------------------

console.log('📡 Launching all microservice files...');

try {
    // This forces Render to read and execute your other files
    require('./prefix.js');
    console.log('✅ prefix.js loaded successfully.');
    
    require('./staff.js');
    console.log('✅ staff.js loaded successfully.');
    
    require('./moderation.js');
    console.log('✅ moderation.js loaded successfully.');
    
    require('./rankup.js');
    console.log('✅ rankup.js loaded successfully.');

    console.log('🚀 All systems are actively running inside Render!');
} catch (err) {
    console.error('🚨 Error launching microservice files:', err);
}
