require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const DEFAULT_PREFIX = '!';

// 1. DATABASE SETUP
if (!process.env.MONGO_URI) {
    console.error('❌ Error: MONGO_URI is missing from Railway variables!');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🍃 Prefix Node connected to MongoDB!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const Config = mongoose.models.Config || mongoose.model('Config', new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, default: '!' }
}));

client.once('ready', () => {
    console.log(`🔀 Prefix Node Active: ${client.user.tag}`);
});

// 2. CHAT COMMAND HANDLER
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    let settings = await Config.findOne({ guildId: message.guild.id });
    const currentPrefix = settings?.prefix || DEFAULT_PREFIX;

    if (!message.content.startsWith(currentPrefix)) return;

    const args = message.content.slice(currentPrefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (command !== 'prefix') return;

    // Permissions check
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ **ACCESS DENIED:** Only server administrators can change the prefix.');
    }

    const action = args[0]?.toLowerCase();
    const newPrefix = args[1];

    // ✅ CASE 1: User typed just "(prefix)prefix" -> Show Info & Dropdown
    if (!action) {
        const infoEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('⚙️ Prefix Configuration Node')
            .setDescription(
                `Current prefix is: **${currentPrefix}**\n\n` +
                `u can change it using:\n` +
                `\`${currentPrefix}prefix change <newPrefix>\` (e.g. \`${currentPrefix}prefix change ?\`)\n\n` +
                `or use the dropdown menu below to pick one instantly!`
            )
            .setTimestamp();

        // Create the dropdown menu components
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('prefix_dropdown_select')
            .setPlaceholder('Select a new prefix from the options...')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('! (Exclamation)').setValue('!').setDescription('Set prefix to !'),
                new StringSelectMenuOptionBuilder().setLabel('? (Question)').setValue('?').setDescription('Set prefix to ?'),
                new StringSelectMenuOptionBuilder().setLabel('. (Dot/Period)').setValue('.').setDescription('Set prefix to .'),
                new StringSelectMenuOptionBuilder().setLabel('$ (Dollar)').setValue('$').setDescription('Set prefix to $'),
                new StringSelectMenuOptionBuilder().setLabel('+ (Plus)').setValue('+').setDescription('Set prefix to +'),
                new StringSelectMenuOptionBuilder().setLabel('- (Minus)').setValue('-').setDescription('Set prefix to -'),
                new StringSelectMenuOptionBuilder().setLabel('> (Arrow)').setValue('>').setDescription('Set prefix to >')
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        return message.reply({ embeds: [infoEmbed], components: [row] });
    }

    // ✅ CASE 2: User typed "(prefix)prefix change <newPrefix>" manually
    if (action === 'change' && newPrefix) {
        if (newPrefix.length > 3) {
            return message.reply('❌ **Error:** Prefixes must be 3 characters or less.');
        }

        if (!settings) {
            settings = new Config({ guildId: message.guild.id, prefix: newPrefix });
        } else {
            settings.prefix = newPrefix;
        }
        await settings.save();

        return message.reply(`✅ **Success!** Global prefix has been changed to \`${newPrefix}\``);
    }
});

// 3. DROPDOWN INTERACTION HANDLER
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'prefix_dropdown_select') return;

    // Security check on the interaction dropdown too
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: '❌ Only server administrators can use this dropdown.', ephemeral: true });
    }

    await interaction.deferUpdate(); // Prevents interaction timeout/error look

    const selectedPrefix = interaction.values[0];

    try {
        // Save selected prefix from dropdown directly to MongoDB
        let settings = await Config.findOne({ guildId: interaction.guild.id });
        if (!settings) {
            settings = new Config({ guildId: interaction.guild.id, prefix: selectedPrefix });
        } else {
            settings.prefix = selectedPrefix;
        }
        await settings.save();

        // Update the embed view to show success state
        const updatedEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('⚙️ Prefix Updated Successfully!')
            .setDescription(`Global prefix has been changed to: **${selectedPrefix}**\n\nYou can now use commands like \`${selectedPrefix}prefix\``)
            .setTimestamp();

        // Remove the dropdown menu components so they can't click it again on an old message
        await interaction.editReply({ embeds: [updatedEmbed], components: [] });

    } catch (err) {
        console.error('🚨 Error updating prefix from dropdown:', err);
        await interaction.followUp({ content: '❌ An error occurred while saving the prefix to the database.', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
