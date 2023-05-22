
const { ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder } = require('discord.js')

module.exports = {
    name: 'tym',
    description: 'Shows info about edge team!',
    permissions: [],
    options: [
      {
        name: 'tym',
        description: 'Jaký tým chceš vidět?',
        type: 3,
        required: true,
        autocomplete: true
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let ikona = interaction.guild.iconURL()

      let tym = interaction.options.getString('tym')
      if (tym == 'null') return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyl nalezen žádný tým!`, color: 15548997 }]})

      let data = await edge.get('general', 'clubs', {_id: tym}).then(n => n[0])

      let embed = {
        title:`${data.name} Informace${data.emoji ? ` ${data.emoji}`:''}`,
        description: data.description || 'Tým nemá žádné informace'
      }
      await interaction.editReply({ embeds: [embed]})

    

    },
    autocomplete: async (edge, interaction) => {

      let tymy = await edge.get('general', 'clubs', {})

      let show = tymy.filter(n => n._id !== 'list').map(n => { return {name: n.name, value: n._id} })
      let focused = interaction.options.getFocused()

      return interaction.respond(show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25) || [{ value: 'null', name: 'Nebyl nalezen žádný tým'}])
    },

}