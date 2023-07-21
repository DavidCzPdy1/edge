
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

      let data = await edge.get('general', 'clubs', {id: tym}).then(n => n[0])

      let embed = {
        title:`${data.name} Informace${data.emoji ? ` ${data.emoji}`:''}`,
        description: data.description || 'Tým nemá žádné informace'
      }

      let buttons = new ActionRowBuilder() 
        .addComponents(new ButtonBuilder().setCustomId(`tym_cmd_players_${tym}`).setStyle(2).setLabel('HRÁČI'))
        .addComponents(new ButtonBuilder().setCustomId(`tym_cmd_trainers_${tym}`).setStyle(2).setLabel('TRENÉŘI'))

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

      let guild = dc_client.guilds.cache.get('1105413744902811688')
      if (!guild) return interaction.followUp({ ephemeral: true, content: `Nebyl nalezen discord server!`})

      let role = guild.roles.cache.get(tym)
      if (!role) return interaction.followUp({ ephemeral: true, content: `Nebyla nalezena discord role!`})

      let members = guild.members.cache.filter(n => n._roles.includes(tym) && n._roles.includes(edge.config.discord.roles.position_trener))
      let players = members.map(n => `<@${n.user.id}>`).join('\n')

      interaction.followUp({ embeds: [{ title: `Seznam trenérů týmu ${role.name}`, description: players, color: '7014665'}], ephemeral: true})
    },
    players: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let tym = interaction.customId.split('_')[3]

      let guild = dc_client.guilds.cache.get('1105413744902811688')
      if (!guild) return interaction.followUp({ ephemeral: true, content: `Nebyl nalezen discord server!`})

      let role = guild.roles.cache.get(tym)
      if (!role) return interaction.followUp({ ephemeral: true, content: `Nebyla nalezena discord role!`})

      let members = guild.members.cache.filter(n => n._roles.includes(tym))
      let players = members.map(n => `<@${n.user.id}>`+ (n._roles.includes(edge.config.discord.roles.position_trener) ? ` - 🥏`:``)).sort((a, b) => b.endsWith('🥏') - a.endsWith('🥏')).join('\n')
      interaction.followUp({ embeds: [{ title: `Seznam hráčů týmu ${role.name}`, description: players, color: 959711}], ephemeral: true})
    }

}