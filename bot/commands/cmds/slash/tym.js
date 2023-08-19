
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
      await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

      let ikona = interaction.guild.iconURL()

      let tym = interaction.options.getString('tym')
      if (tym == 'null') return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyl nalezen žádný tým!`, color: 15548997 }]})

      let data = await edge.get('general', 'clubs', {id: tym}).then(n => n[0])

      let embed = {
        title:`${data.name} Informace${data.emoji ? ` ${data.emoji}`:''}`,
        description: data.description || 'Tým nemá žádné informace',
        color: data.color || 86654
      }

      let buttons = new ActionRowBuilder() 
        .addComponents(new ButtonBuilder().setCustomId(`tym_cmd_players_${tym}_${data.name}`).setStyle(2).setLabel('HRÁČI'))
        .addComponents(new ButtonBuilder().setCustomId(`tym_cmd_trainers_${tym}_${data.name}`).setStyle(2).setLabel('TRENÉŘI'))

      await interaction.editReply({ embeds: [embed], components: [buttons]})

    

    },
    autocomplete: async (edge, interaction) => {

      let tymy = await edge.get('general', 'clubs', {})

      let show = tymy.map(n => { return {name: n.name, value: n.id} })
      let focused = interaction.options.getFocused()

      let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25)
      return interaction.respond(z.length ? z : [{ value: 'null', name: 'Nebyl nalezen žádný tým'}])
    },
    trainers: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let tym = interaction.customId.split('_')[3]
      let name = interaction.customId.split('_')[4]

      let users = await edge.get('general', 'users', {}).then(n => n.filter(a => a.team == tym))
      let trainer = await edge.get('general', 'treneri', {_id: 'list'}).then(n => n[0])

      let players = users.filter(n => trainer.list.includes(n._id)).map(n => `<@${n._id}>`).sort().join('\n')

      interaction.followUp({ embeds: [{ title: `Seznam trenérů týmu ${name}`, description: players, color: 7014665}], ephemeral: edge.isEphemeral(interaction)})
    },
    players: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let tym = interaction.customId.split('_')[3]
      let name = interaction.customId.split('_')[4]

      let users = await edge.get('general', 'users', {}).then(n => n.filter(a => a.list.includes(tym)))
      let trainer = await edge.get('general', 'treneri', {_id: 'list'}).then(n => n[0])

      let players = users.map(n => `<@${n._id}>${trainer.list.includes(n._id) && n.team == tym ? ` - 🥏`:``}${n.team !== tym ? ` - ❌`:``}`).sort().sort((a, b) => b.endsWith('🥏') - a.endsWith('🥏')).sort((a, b) => a.endsWith('❌') - b.endsWith('❌')).join('\n')
      interaction.followUp({ embeds: [{ title: `Seznam hráčů týmu ${name}`, description: players, color: 959711}], ephemeral: edge.isEphemeral(interaction)})
    }

}