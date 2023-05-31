
const { ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder } = require('discord.js')

module.exports = {
    name: 'events',
    description: 'Shows events info!',
    permissions: [],
    options: [
      {
        name: 'event',
        description: 'Jaký event chceš vidět?',
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

      if (interaction.guild.id !== '1105413744902811688') return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nejsi na EDGE DC!`, color: 15548997 }]})

      let event = interaction.options.getString('event')
      if (event == 'null') return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyl nalezen žádný event!`, color: 15548997 }]})

      let data = await edge.get('general', 'events', {_id: event}).then(n => n[0])

      let embed = edge.commands.get('hlasovani').getEmbed(data, {tym: true})
  
      if (data.lastPing) embed.description = embed.description + `\nLast Ping: <t:${data.lastPing/1000}:R>`
      if (data.mode == 'team') embed.description = embed.description + `\n*Hlasuje se za tým*`

      let buttons = new ActionRowBuilder();

      if (data.time < new Date().getTime()) buttons.addComponents(new ButtonBuilder().setCustomId(`events_cmd_pause_${data._id}`).setStyle(4).setLabel('PAUSE'))
      else buttons.addComponents(new ButtonBuilder().setCustomId(`events_cmd_open_${data._id}`).setStyle(3).setLabel('OPEN'))
      buttons.addComponents(new ButtonBuilder().setCustomId(`events_cmd_ping_${data._id}`).setStyle(3).setLabel('PING NOW').setDisabled(data.mode == 'team' ? false : true))
      buttons.addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_accept_${data._id}`).setStyle(2).setLabel('SEND NEW MSG').setDisabled(false))

      

      await interaction.editReply({ embeds: [embed], components: [buttons]})

    },
    autocomplete: async (edge, interaction) => {

      let tymy = await edge.get('general', 'events', {})

      let show = tymy.filter(n => n._id !== 'list').map(n => { return {name: n.name, value: n._id} })
      let focused = interaction.options.getFocused()

      return interaction.respond(show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25) || [{ value: 'null', name: 'Nebyl nalezen žádný tým'}])
    },
    pause: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]

      let data = await edge.get('general', 'events', {_id: question})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      let channel = await dc_client.channels.cache.get(data.channel)
      if (!channel) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný channel!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      let message = await channel?.messages.fetch(data.message || 0)
      if (!message) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem danou zprávu!', description: `Pošli prosím novou!`, color: 15548997 }], ephemeral: true })

      let embed = edge.commands.get('hlasovani').getEmbed(data, { guild: interaction.guild })
      if (data.time && data.time < new Date().getTime()) embed.title = embed.title + ' - PAUSED'

      let components = message.components[0]
      components.components.forEach(n => n.data.disabled = true)
      await message.edit({ components: [components], embeds: [embed]})
    },
    open: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]

      let data = await edge.get('general', 'events', {_id: question})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]
      
      let channel = await dc_client.channels.cache.get(data.channel)
      if (!channel) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný channel!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      let message = await channel?.messages.fetch(data.message || 0)
      if (!message) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem danou zprávu!', description: `Pošli prosím novou!`, color: 15548997 }], ephemeral: true })

      if (data.time && data.time > new Date().getTime()) {
        await interaction.followUp({ ephemeral: true, content: 'Čas byl změněn na neomezen'})
        data.time = null
        await edge.post('general', 'events', data)
      }
      let embed = edge.commands.get('hlasovani').getEmbed(data, { guild: interaction.guild })

      let components = message.components[0]
      components.components.forEach(n => n.data.disabled = false)
      await message.edit({ components: [components], embeds: [embed]})
    },
    ping: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]

      let data = await edge.get('general', 'events', {_id: question})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      let answered = []
      data.answers.split('|').forEach(n => {data[n].forEach(a => answered.push(a))})

      let guild = interaction.guild
      if (!guild) return console.error('EVENTS interaction - Nenašel jsem guildu')

      let notify = Object.keys(edge.config.discord.roles).filter(n => n.startsWith('club_')).map(n => edge.config.discord.roles[n]).filter(n => !answered.includes(n)).map(n => guild.roles.cache.get(n))
      let errors = []
      let success = []
      for (let role of notify) {
        let members = role.members.filter(n => n._roles.includes(edge.config.discord.roles.position_trener))

        
        for (let member of members) {
          member = member[1]
          try {
            await member.user.send(`Ahoj, tvůj tým ještě nezareagoval na zprávu v <#${data.channel}>`) 
            success.push(member.user)
          } catch (e) {errors.push(member.user)}
        }
      }
      let embed = {title: `Notify ${data._id} eventu!`, description: `Sent to ${success.length}/${success.length+errors.length} members!`}
      if (errors.length) embed.description = embed.description + `\n\nErrors:\n${errors.join('\n')}`
      global.channels?.log?.send({ embeds: [embed] })
      interaction.followUp({ ephemeral: true, embeds: [embed]})
      data.lastPing = new Date().getTime() - 50000

      await edge.post('general', 'events', data)
    }

}