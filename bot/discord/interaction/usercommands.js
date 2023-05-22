
module.exports = async (edge, interaction) => {
    const cmd = edge.commands.get(interaction.commandName);
    if (!cmd) {
        return interaction.reply({ content: "Command nebyl nalezen, kontaktuj prosím developery!", ephemeral: true });
    }

    interaction.member = interaction.guild ? interaction.guild.members.cache.get(interaction.user.id) : null;

    if (!edge.handlePerms(cmd.permissions, interaction)) {
        return interaction.reply({ content: "Nemáš potřebná oprávnění!", ephemeral: true });
    }

    console.discord(`${cmd.name} user command was requested by <@${interaction.user.id}>`)

    cmd.run(edge, interaction).catch(async (e) => {
        if (interaction.deferred === false && interaction.replied === false) interaction.reply({ embeds: [await console.error(e)], ephemeral: true })
        else interaction.followUp({ embeds: [await console.error(e)], ephemeral: true })
    })
}
