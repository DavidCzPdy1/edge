
module.exports = async (edge, interaction) => {
    
    let cmd = edge.commands.get(edge.getCmdName(interaction));
    if (!cmd) {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
        return interaction.editReply({ content: "Command nebyl nalezen, kontaktuj prosím developery!", ephemeral: true });
    }

    interaction.member = interaction.guild ? interaction.guild.members.cache.get(interaction.user.id) : null;

    if (!edge.handlePerms(cmd.permissions, interaction)) {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
        return interaction.editReply({ content: "Nemáš potřebná oprávnění!", ephemeral: true });
    }

    if (interaction.user.id !== '378928808989949964') console.discord(`${cmd.name} command was requested by <@${interaction.user.id}>`)

    cmd.run(edge, interaction).catch(async (e) => {
        if (interaction.deferred === false && interaction.replied === false) interaction.reply({ embeds: [await console.error(e)], ephemeral: true })
        else interaction.followUp({ embeds: [await console.error(e)], ephemeral: true })
    })
}
