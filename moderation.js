const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');

// Grab your existing configuration models
const Config = mongoose.models.Config || mongoose.model('Config', new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, default: '!' }
}));

const StaffRoster = mongoose.models.StaffRoster || mongoose.model('StaffRoster', new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true }
}));

console.log('🔨 Moderation Module injected successfully into master core.');

// CHANGE THIS LINE to use the master route instead of client.on
process.on('messageCreateRoute', async (message) => {
    if (message.author.bot || !message.guild) return;

    const settings = await Config.findOne({ guildId: message.guild.id });
    const currentPrefix = settings?.prefix || '!';

    if (!message.content.startsWith(currentPrefix)) return;

    const args = message.content.slice(currentPrefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    // --- YOUR EXISTING MODERATION COMMAND LOGIC CONTINUES HERE ---
    // (Keep your ban, kick, or purge code exactly as you had it below this line!)
