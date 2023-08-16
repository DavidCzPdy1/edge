
module.exports = async (edge, interaction) => {
    let cID = interaction.customId 
    if (interaction.isChatInputCommand()) require('../interaction/slashcommands')(edge, interaction)
    else if (interaction.isUserContextMenuCommand()) require('../interaction/usercommands')(edge, interaction)
    else if (interaction.isAutocomplete())  edge.commands.get(edge.getCmdName(interaction)).autocomplete(edge, interaction)
    else if (cID?.split('_')[1] == 'cmd' && edge.commands.get(cID.split('_')[0])) try { edge.commands.get(cID.split('_')[0])[cID.split('_')[2]] (edge, interaction) } catch (e) {console.error(e).then((n) => interaction.reply({ embeds: [n], ephemeral: edge.isEphemeral(interaction)}).catch((a) => interaction.followUp({ embeds: [n], ephemeral: edge.isEphemeral(interaction)}).catch((o) =>{console.error(o)})))}
    else if (cID?.split('_')[1] == 'ignore' );
    else if (cID) require(`../interaction/${cID.split('_')[0]}`)(edge, interaction)
}
