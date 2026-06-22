require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');

// 1. INITIALIZE CLIENT
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const DEFAULT_PREFIX = '!';

// 2. CONNECT TO DATABASE
if (!process.env.MONGO_URI) {
    console.error('❌ Error: MONGO_URI is missing from Railway variables!');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🍃 Prefix Node connected to MongoDB successfully!'))
    .catch(err => console.error('❌ MongoDB Connection Error (Prefix):', err));

// 3. DEFINE THE CONFIG SCHEMA
// This structure matches your other files perfectly so they share the exact same data.
const Config = mongoose.models.Config || mongoose.model('Config', new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, default: '!' }
}));

// 4. CLIENT READY EVENT
client.once('ready', () => {
    console.log(`🔀 Prefix Configuration Node Active: ${client.user.tag}`);
});

// 5. CORE MESSAGE PIPELINE
client.on('messageCreate', async (message) => {
    // Ignore bots and DM messages
    if (message.author.bot || !message.guild) return;

    // Fetch the server's current prefix from the database (fallback to "!" if new)
    let settings = await Config.findOne({ guildId: message.guild.id });
    const currentPrefix = settings?.prefix || DEFAULT_PREFIX;

    // If the message doesn't start with the current prefix, ignore it entirely
    if (!message.content.startsWith(currentPrefix)) return;

    // Split arguments clean
    const args = message.content.slice(currentPrefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    // Only process the prefix command, drop out if it's anything else
    if (command !== 'prefix') return;

    // --- SECURITY PROTOCOL ---
    // Only users with Administrator permissions can change the prefix
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ **ACCESS DENIED:** Only server administrators can modify the command prefix.');
    }

    const action = args[0]?.toLowerCase(); // should be 'change'
    const newPrefix = args[1];

    // If they just type !prefix without subcommands, show the current setup
    if (!action || action !== 'change' || !newPrefix) {
        return message.reply(`🤖 **Current System Prefix:** \`${currentPrefix}\`\n👉 To change it, use: \`${currentPrefix}prefix change <newPrefix>\` (e.g., \`${currentPrefix}prefix change ?\`)`);
    }

    // Protection rule: Max prefix length of 3 characters (prevents breaking UI layout elements)
    if (newPrefix.length > 3) {
        return message.reply('❌ **Error:** Prefixes must be 3 characters or less to keep command strings clean.');
    }

    try {
        // Save or update the record inside MongoDB
        if (!settings) {
            settings = new Config({
                guildId: message.guild.id,
                prefix: newPrefix
            });
        } else {
            settings.prefix = newPrefix;
        }

        await settings.save();

        // Send a polished confirmation embed
        const successEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('⚙️ System Prefix Updated')
            .setDescription(`Global prefix has been updated successfully for this server.`)
            .addFields(
                { name: '⬅️ Old Prefix', value: `\`${currentPrefix}\``, inline: true },
                { name: '➡️ New Prefix', value: `\`${newPrefix}\``, inline: true }
            )
            .setFooter({ text: `Authorized by ${message.author.tag}` })
            .setTimestamp();

        return message.reply({ embeds: [successEmbed] });

    } catch (err) {
        console.error('🚨 Error processing prefix change inside database:', err);
        return message.reply('❌ An internal cloud database error occurred while trying to save the new prefix.');
    }
});

// 6. LOG IN THE WORKER NODE
client.login(process.env.DISCORD_TOKEN);
