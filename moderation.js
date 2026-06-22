const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');

const Config = mongoose.models.Config || mongoose.model('Config', new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, default: '!' }
}));

const StaffRoster = mongoose.models.StaffRoster || mongoose.model('StaffRoster', new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true }
}));

console.log('🔨 Moderation Module injected successfully into master core.');

process.on('messageCreateRoute', async (message) => {
    if (message.author.bot || !message.guild) return;

    const settings = await Config.findOne({ guildId: message.guild.id });
    const currentPrefix = settings?.prefix || '!';

    if (!message.content.startsWith(currentPrefix)) return;

    const args = message.content.slice(currentPrefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (!['kick', 'ban', 'purge'].includes(command)) return;

    const isServerAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const isRegisteredStaff = await StaffRoster.findOne({ guildId: message.guild.id, userId: message.author.id });

    if (!isServerAdmin && !isRegisteredStaff) {
        return message.reply('❌ **ACCESS DENIED:** You must be on the registered Staff roster to execute admin moderation.');
    }

    try {
        if (command === 'kick') {
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Please mention a valid user to kick.');
            if (!target.kickable) return message.reply('❌ I cannot kick this user. Check role hierarchies.');

            const reason = args.join(' ') || 'No reason provided';
            await target.kick(reason);
            return message.reply(`👢 **Kicked:** ${target.user.tag} has been removed. Reason: \`${reason}\``);
        }

        if (command === 'ban') {
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Please mention a valid user to ban.');
            if (!target.bannable) return message.reply('❌ I cannot ban this user. Check role hierarchies.');

            const reason = args.join(' ') || 'No reason provided';
            await target.ban({ reason });
            return message.reply(`🔨 **Banned:** ${target.user.tag} has been banned. Reason: \`${reason}\``);
        }

        if (command === 'purge') {
            const amount = parseInt(args[0], 10);
            if (isNaN(amount) || amount < 1 || amount > 100) return message.reply('❌ Please provide an amount between 1 and 100 logs to delete.');

            await message.channel.bulkDelete(amount, true);
            const msg = await message.channel.send(`🧹 Clear operations processed: deleted \`${amount}\` entries.`);
            setTimeout(() => msg.delete().catch(() => {}), 3000);
        }
    } catch (err) {
        console.error(err);
        return message.reply('❌ Failed to execute moderation command process.');
    }
});
