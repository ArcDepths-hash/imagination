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

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const DEFAULT_PREFIX = '!';

const Config = mongoose.models.Config || mongoose.model('Config', new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, default: '!' }
}));

// Connect to the same Staff Roster model
const StaffRoster = mongoose.models.StaffRoster || mongoose.model('StaffRoster', new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true }
}));

if (process.env.MONGO_URI) mongoose.connect(process.env.MONGO_URI).catch(err => console.error(err));

client.once('ready', () => console.log(`🔀 Prefix Node Connected: ${client.user.tag}`));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    let settings = await Config.findOne({ guildId: message.guild.id });
    const currentPrefix = settings?.prefix || DEFAULT_PREFIX;

    if (!message.content.startsWith(currentPrefix)) return;

    const args = message.content.slice(currentPrefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (command !== 'prefix') return;

    // --- INTEGRATED HYBRID SECURITY CHECK ---
    const isServerAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const isRegisteredStaff = await StaffRoster.findOne({ guildId: message.guild.id, userId: message.author.id });

    if (!isServerAdmin && !isRegisteredStaff) {
        return message.reply('❌ **ACCESS DENIED:** You must be an Admin or on the registered Staff roster to change this.');
    }

    const action = args[0]?.toLowerCase();
    const newPrefix = args[1];

    if (!action) {
        const infoEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('⚙️ Prefix Configuration Node')
            .setDescription(
                `Current prefix is: **${currentPrefix}**\n\n` +
                `u can change it using:\n` +
                `\`${currentPrefix}prefix change <newPrefix>\`\n\n` +
                `or use the dropdown menu below!`
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('prefix_dropdown_select')
            .setPlaceholder('Select a new prefix...')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('!').setValue('!'),
                new StringSelectMenuOptionBuilder().setLabel('?').setValue('?'),
                new StringSelectMenuOptionBuilder().setLabel('.').setValue('.'),
                new StringSelectMenuOptionBuilder().setLabel('$').setValue('$')
            );

        return message.reply({ embeds: [infoEmbed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
    }

    if (action === 'change' && newPrefix) {
        if (newPrefix.length > 3) return message.reply('❌ Max 3 characters.');
        if (!settings) settings = new Config({ guildId: message.guild.id, prefix: newPrefix });
        else settings.prefix = newPrefix;
        await settings.save();
        return message.reply(`✅ Global prefix changed to \`${newPrefix}\``);
    }
});

// DROPDOWN INTERACTION UPDATE
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'prefix_dropdown_select') return;

    const isServerAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const isRegisteredStaff = await StaffRoster.findOne({ guildId: interaction.guild.id, userId: interaction.user.id });

    if (!isServerAdmin && !isRegisteredStaff) {
        return interaction.reply({ content: '❌ Access Denied: Staff roster authorization required.', ephemeral: true });
    }

    await interaction.deferUpdate();
    const selectedPrefix = interaction.values[0];

    let settings = await Config.findOne({ guildId: interaction.guild.id });
    if (!settings) settings = new Config({ guildId: interaction.guild.id, prefix: selectedPrefix });
    else settings.prefix = selectedPrefix;
    await settings.save();

    const updatedEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('⚙️ Prefix Updated Successfully!')
        .setDescription(`Global prefix has been changed to: **${selectedPrefix}**`);

    await interaction.editReply({ embeds: [updatedEmbed], components: [] });
});

client.login(process.env.DISCORD_TOKEN);
