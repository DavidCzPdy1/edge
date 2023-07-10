
module.exports = async (edge, interaction) => {
    if (interaction.isChatInputCommand()) require('../interaction/slashcommands')(edge, interaction)
    else if (interaction.isUserContextMenuCommand()) require('../interaction/usercommands')(edge, interaction)
    else if (interaction.isAutocomplete())  edge.commands.get(interaction.commandName).autocomplete(edge, interaction)
    else if (interaction.customId?.split('_')[1] == 'cmd' && edge.commands.get(interaction.customId.split('_')[0])) try { edge.commands.get(interaction.customId.split('_')[0])[interaction.customId.split('_')[2]] (edge, interaction) } catch (e) {console.error(e).then((n) => interaction.reply({ embeds: [n], ephemeral: true}).catch((a) => interaction.followUp({ embeds: [n], ephemeral: true}).catch((o) =>{console.error(o)})))}
    else if (interaction.customId?.split('_')[1] == 'ignore' && edge.commands.get(interaction.customId.split('_')[0]));
    else if (interaction.customId) require(`../interaction/${interaction.customId.split('_')[0]}`)(edge, interaction)
}
