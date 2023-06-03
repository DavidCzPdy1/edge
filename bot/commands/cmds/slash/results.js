
const { ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder } = require('discord.js')

module.exports = {
    name: 'results',
    description: 'Shows resluts of forms!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [
      {
        name: 'event',
        description: 'Jaký event chceš vidět?',
        type: 3,
        required: true,
        autocomplete: true
      },
      {
        name: 'answer',
        description: 'Jakou odpověď chceš vidět?',
        type: 3,
        required: false,
        autocomplete: true
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let ikona = interaction.guild.iconURL()

      if (interaction.guild?.id !== '1105413744902811688') return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nejsi na EDGE DC!`, color: 15548997 }]})

      let event = interaction.options.getString('event')
      if (event == 'null') return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyl nalezen žádný event!`, color: 15548997 }]})
      console.log(event)
      let answer = interaction.options.getString('answer')
      if (answer == 'null') return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyl nalezena žádná odpověď!`, color: 15548997 }]})
      console.log(answer)
      let data = await edge.get('general', 'events', {_id: event}).then(n => n[0])
      if (!data) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyly nalezeny žádná data!`, color: 15548997 }]})

      let embed = edge.commands.get('hlasovani').getEmbed(data, {tym: true, guild: interaction.guild})
  
      embed.title = embed.title + ' Informace'
      if (data.lastPing) embed.description = embed.description + `\nLast Ping: <t:${Math.floor(data.lastPing/1000)}:R>`
      if (data.mode == 'team') embed.description = embed.description + `\n*Hlasuje se za tým*`


      await interaction.editReply({ embeds: [embed], components: []})

    },
    autocomplete: async (edge, interaction) => {

      let current = interaction.options._hoistedOptions.filter(n => n.focused)[0].name
      if (current !== 'event' && !interaction.options.getString('event')) return interaction.respond([ {name: 'Vyber nejdříve event!', value: 'null'} ])

      if (current == 'event') {
        let tymy = await edge.get('general', 'events', {})
        tymy = tymy.filter(n => n.type == 'form')

        let show = tymy.map(n => { return {name: n._id, value: n._id} })
        let focused = interaction.options.getFocused()
  
        return interaction.respond(show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25) || [{ value: 'null', name: 'Nebyl nalezen žádný event'}])
      } else if (current == 'answer') {
        let event = interaction.options.getString('event')
        let data = await edge.get('general', 'events', {_id: event}).then(n => n.filter(n => n.type == 'form')[0])
        if (!data) return interaction.respond([ {name: 'Nenašel jsem daný event!', value: 'null'} ])

        let guild = dc_client.guilds.cache.get('1105413744902811688')
        let show = data.Accept.map(n => {
          let mention = data.mode == 'team' ? guild.roles.cache.get(n.id || n) : guild.members.cache.get(n.id || n)
          let name = mention?.name || mention?.nickname || mention?.user?.username
          return {name: name, value: n.id}
        })
        let focused = interaction.options.getFocused()
        return interaction.respond(show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25) || [{ value: 'null', name: 'Nebyl nalezena žádná odpověď'}])
      }
    },
}