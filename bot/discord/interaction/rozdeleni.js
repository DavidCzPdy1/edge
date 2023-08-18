const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } = require("discord.js");
const axios = require('axios');
const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

module.exports = async (edge, interaction) => {
    let action = interaction.customId.split('_')[1]
    let type = interaction.customId.split('_')[2]

    let user;
    let team;

    if (action == 'button') {

        user = await edge.get('general', 'users', {_id: interaction.user.id}).then(n => n[0])
        team = await edge.get('general', 'clubs', {}).then(n => n.find(a => a.server?.guild === interaction.guild.id))
        if (!team) team = {}

        if (!user) {
            const modal = new ModalBuilder().setCustomId(`rozdeleni_verify_${type}`).setTitle(`Zadání jména!`)
            .addComponents(textBox({ id: 'jmeno', text: 'Jaké máš jméno?', example: 'Jméno Příjmení', value: undefined, required: true}))

            return await interaction.showModal(modal);
        } else await interaction.reply({ ephemeral: true, content: 'Už jsi verifikovaný, brzo dostaneš příslušné role!' })

        if (interaction.guild.id == '1122995611621392424' && team.id === user.team) {
          user.rakety = type
          await edge.post('general', 'users', user)
        }
    } else if (action == 'verify') {
        await interaction.update({ type: 6 })
        let jmeno = interaction.fields.fields.get('jmeno').value

        team = await edge.get('general', 'clubs', {}).then(n => n.find(a => a.server?.guild === interaction.guild.id))
        if (!team) team = {}
        
        user = {_id: interaction.user.id, name: jmeno, team: type === 'G' ? 'ne' : team?.id || 'ne', list: type === 'G' ? [] : [team?.id||null].filter(n =>n), blacklist: []}
        try {
          if (process.env.namesApi) {
            let url = `https://api.parser.name/?api_key=${process.env.namesApi}&endpoint=extract&text=${jmeno.replaceAll(' ', '%20')}`
            let result = await axios.get(url)
            if (result.data.data?.length) {
              let gender = result.data.data[0].parsed.name.firstname.gender
              if (gender == 'm') user.gender = 'M'
              else if (gender == 'f') user.gender = 'W'
            }
          }
        } catch (e) {}

        if (interaction.guild.id == '1122995611621392424') user.rakety = type
        
        await edge.post('general', 'users', user)
        console.discord(`${jmeno} - tymova verifikace jako ${type}`)
        await interaction.followUp({ ephemeral: true, content: 'Právě ses verifikoval, brzo dostaneš příslušné role!' })
    }
    edge.discord.roles.updateRoles([interaction.user.id])
}
