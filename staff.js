const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const mongoose = require('mongoose');

const Config = mongoose.models.Config || mongoose.model('Config', new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, default: '!' }
}));

const StaffRoster = mongoose.models.StaffRoster || mongoose.model('StaffRoster', new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true }
}));

console.log('🛡️ Staff Operations Module injected successfully into master core.');

process.on('messageCreateRoute', async (message) => {
    if (message.author.bot || !message.guild) return;

    const settings = await Config.findOne({ guildId: message.guild.id });
    const currentPrefix = settings?.prefix || '!';

    if (!message.content.startsWith(currentPrefix)) return;

    const args = message.content.slice(currentPrefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (command !== 'staff') return;

    const subCommand = args[0]?.toLowerCase();
    const isServerAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const isRegisteredStaff = await StaffRoster.findOne({ guildId: message.guild.id, userId: message.author.id });

    if (!isServerAdmin && !isRegisteredStaff) {
        return message.reply('❌ **ACCESS DENIED:** You are not on the registered Staff roster.');
    }

    try {
        if (subCommand === 'log') {
            const roster = await StaffRoster.find({ guildId: message.guild.id });
            if (roster.length === 0) return message.reply('📝 **Staff Roster:** No staff members have been registered yet.');

            const staffList = roster.map((member, index) => `${index + 1}. <@${member.userId}> (ID: \`${member.userId}\`)`).join('\n');
            const rosterEmbed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📋 Registered Staff Roster')
                .setDescription(staffList)
                .setTimestamp();

            return message.reply({ embeds: [rosterEmbed] });
        }

        if (subCommand === 'add') {
            if (!isServerAdmin) return message.reply('❌ Only server administrators can add members to the roster.');
            const targetUser = message.mentions.users.first() || await message.client.users.fetch(args[1]).catch(() => null);
            if (!targetUser) return message.reply(`❌ **Usage:** \`${currentPrefix}staff add @user\``);

            const existing = await StaffRoster.findOne({ guildId: message.guild.id, userId: targetUser.id });
            if (existing) return message.reply('ℹ️ That user is already on the staff roster.');

            await StaffRoster.create({ guildId: message.guild.id, userId: targetUser.id });
            return message.reply(`✅ Added **${targetUser.username}** to the registered staff list.`);
        }

        if (subCommand === 'remove') {
            if (!isServerAdmin) return message.reply('❌ Only server administrators can remove members from the roster.');
            const targetUser = message.mentions.users.first() || await message.client.users.fetch(args[1]).catch(() => null);
            if (!targetUser) return message.reply(`❌ **Usage:** \`${currentPrefix}staff remove @user\``);

            const result = await StaffRoster.deleteOne({ guildId: message.guild.id, userId: targetUser.id });
            if (result.deletedCount === 0) return message.reply('❌ That user was not found on the staff roster.');

            return message.reply(`🗑️ Removed **${targetUser.username}** from the registered staff list.`);
        }
    } catch (err) {
        console.error(err);
        return message.reply('❌ An error occurred while managing the staff database.');
    }
});
