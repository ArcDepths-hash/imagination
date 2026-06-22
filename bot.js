// --- RENDER FREE TIER KEEP-ALIVE ---
const http = require('http');
http.createServer((req, res) => res.end('Master System Launcher Online!')).listen(process.env.PORT || 3000);
console.log('🌐 Web listener initialized for Render free tier.');
// ------------------------------------

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Shared Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🍃 Core database link active.'))
    .catch(err => console.error('❌ MongoDB Global Connection Error:', err));

global.client = client;

console.log('📡 Launching all microservice files...');

// Load all microservice code scripts into process memory
require('./prefix.js');
require('./staff.js');
require('./moderation.js');
require('./rankup.js');

// Route data streams cleanly down to the modules via process emitters
client.on('messageCreate', (message) => {
    process.emit('messageCreateRoute', message);
});

client.on('interactionCreate', (interaction) => {
    process.emit('interactionCreateRoute', interaction);
});

client.once('ready', () => {
    console.log(`🚀 Master Launcher Online: ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
