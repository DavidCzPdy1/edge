
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }
const getEmbed = (data, options = {}) => {
  let embed =  {
      title: data.name || data._id,
      description: data.description,
      fields: data.answers?.split('|').map(n => { return {name: `${n.trim()} - 0`, value: `\u200B`, inline: true} }) || [],
      color: 1613,
  }

  if (data.time) {
    embed.timestamp = new Date(data.time)
    embed.footer = { text: 'Konec reakcí'}
    embed.description = embed.description + `\n**Time:** <t:${data.time/1000}:R>`
  }

  if (data.settings == 'duplicate') embed.description = embed.description + `\n*Hlasuje se neomezeně*`
  if (data.settings == 'hide') embed.description = embed.description + `\n*Hlasuje se skrytě*`
  if (data.mode == 'team' && !options.tym ) embed.description = embed.description + `\n*Reaguje se za tým*`

  if (options.guild) {
    embed.fields = embed.fields.map(n => {
      let name = n.name.split(' - ')[0] + ` - ${data[n.name.split(' - ')[0]].filter(a => options.showId ? (a?.id || a) == options.showId : true).length}`
      let value = data[n.name.split(' - ')[0]].filter(a => options.showId ? (a?.id || a) == options.showId : true).map(a => {
        let id = a.id || a
        if (data.format == 'mention') return (data.mode == 'team' ?  `<@&${id}>` :  `<@${id}>`)
        let mention = data.mode == 'team' ? options.guild.roles.cache.get(id) : options.guild.members.cache.get(id)
        return mention?.name || mention?.nickname || mention?.user?.username
      }).join('\n')
      if (!value.length) value = '\u200B'
      return {name: name, value: value, inline: true}
    })
  }

  if (data.settings == 'hide' && !options.show && !options.showId) embed.fields = data.answers?.split('|').map(n => { return {name: `${n.trim()} - 0`, value: `||skryté||`, inline: true} }) || []

  return embed
}

module.exports = {
    name: 'hlasovani',
    description: 'Creates new question!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [
      {
        name: 'question',
        description: 'Jaká je otázka?',
        type: 3,
        required: true
      },
      {
        name: 'description',
        description: 'Jaký je popisek?',
        type: 3,
        required: true
      },
      {
        name: 'answers',
        description: 'Jaké jsou možnosti? (Ano|Ne|Nevím|...)',
        type: 3,
        required: true
      },
      {
        name: 'time',
        description: 'Do kdy se musí hlasovat?',
        type: 3,
        required: false
      },
      {
        name: 'mode',
        description: 'Druh',
        type: 3,
        required: false,
        choices: [
          { value: 'team', name: 'Za tým' },
          { value: 'user', name: 'Za sebe' },
        ]
      },
      {
        name: 'pings',
        description: 'Kolikrát mám před koncem upomenout trenéry týmů?',
        type: 4,
        required: false
      },
      {
        name: 'perms',
        description: 'Kdo může hlasovat?',
        type: 3,
        required: false,
        choices: [
          { value: 'trener', name: 'Trenér' },
          { value: 'member', name: 'Kdokoliv' },
        ]
      },
      {
        name: 'settings',
        description: 'Jaké chceš nastavení?',
        type: 3,
        required: false,
        choices: [
          { value: 'show', name: 'Zobrazovat hlasy & 1 hlas' },
          { value: 'hide', name: 'Skrýt hlasy' },
          { value: 'duplicate', name: '∞ hlasy' },
        ]
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let data = {
        _id: String(new Date().getTime()),
        name: interaction.options.getString('question').replaceAll('_', ' '),
        description: interaction.options.getString('description'),
        answers: interaction.options.getString('answers').replaceAll('.', '/'),
        time: interaction.options.getString('time') || null,
        mode: interaction.options.getString('mode') || 'team',
        settings: interaction.options.getString('settings') || 'show',
        type: 'hlasovani',
        channel: '1105918656203980870',
        perms: interaction.options.getString('perms') || 'trener',
        pings: interaction.options.getInteger('pings') || 0,
        pingsData: [],
        created: new Date().getTime(),
        format: 'text' || 'mention'
      }

      data.answers = data.answers.replaceAll('-', '➜').split('|').filter((item, pos) => data.answers.split('|').indexOf(item) == pos).join('|')

      let events = await edge.get('general', 'events', {}).then(n => n.filter(a => a._id.toLowerCase() == data._id.toLowerCase()))
      let errorEmbed = { title: `ERROR! Použij příkaz znovu: </${interaction.commandName}:${interaction.commandId}>`, description: `Hlasování nebo event s tímto názvem už existuje!`, fields: Object.keys(data).filter(n => data[n]).map(n => {return{ name: n, value: `\`${data[n]}\``, inline: true}}), color: 15548997, footer: { icon_url: interaction?.guild?.iconURL() || '', text: 'EDGE Discord'} }
      if (events.length) return interaction.editReply({ embeds: [errorEmbed]})
      

      if (data.time) {
        let time = data.time.split('.').map(n => n.trim())
        let cas = [time[2], time[1].length == 1 ? `0${time[1]}` : time[1], time[0].length == 1 ? `0${time[0]}`: time[0] ]
        data.time = Date.parse(`${cas[0]}-${cas[1]}-${cas[2]} 23:59`)

        if (data.time < new Date().getTime()) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Zadaný čas už byl!`)]})
        else if (data.time - 1000*60*60*20 < new Date().getTime()) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Zadaný čas je dřív než za 20 hodin!`)]})

        if (data.pings) {
          for (let i = 0; i < data.pings; i++) {
            let pingData = {
              id: i,
              pingAt: data.time - 86400000*(i+1) - 3600000*5,
              pinged: false
            }
            if (pingData.pingAt > new Date().getTime()) data.pingsData.push(pingData)
          }
        }
      } else data.finished = -1;

      let embed = getEmbed(data)
      if (embed.fields.length > 5) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Je zadáno moc odpovědí! (${embed.fields.length})`)]})

      let odpovedi = new ActionRowBuilder();

      for (let answer of data.answers.split('|')) {
        odpovedi.addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_select_${data._id}_${answer}`).setStyle(2).setLabel(answer).setDisabled(true))
        data[answer] = []
      }

      let accept = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_accept_${data._id}`).setStyle(3).setLabel('POSLAT'))
        .addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_deny_${data._id}`).setStyle(4).setLabel('NEPOSLAT'))
        

      await edge.post('general', 'events', data)

      let souhrn = Object.keys(data).map(n => { return {name: n, value: data[n], inline: true}}).filter(n => typeof n.value === 'string' || typeof n.value === 'number')
      await interaction.editReply({ embeds: [{ title: 'Souhrn:', fields: souhrn, color: 2982048}], ephemeral: true})
      await interaction.followUp({ embeds: [embed], components: [odpovedi, accept], ephemeral: true})

    },
    select: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let _id = interaction.customId.split('_')[3]
      let answer = interaction.customId.split('_')[4]
      let select = interaction.customId.split('_')[5] === interaction.customId.split('_')[4]

      let data = await edge.get('general', 'events', {_id: _id})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      if (interaction.guild?.id !== '1105413744902811688') return interaction.followUp({ embeds: [{ title: 'Nenašel jsem edge discord server!', description: `Wierd error :D`, color: 15548997 }], ephemeral: true })

      let access = interaction.member._roles.includes(edge.config.discord.roles[`position_${data.perms || 'trener'}`])
      if (!access) return interaction.followUp({ embeds: [{ title: 'Nemáš potřebné oprávnění na reakci!', description: `Potřebuješ <@&${edge.config.discord.roles[`position_${data.perms}`]}>`, color: 15548997 }], ephemeral: true })

      let teams = (edge.discord.roles.teams || await edge.get('general', 'clubs', {})).map(n => n.id)
      let id = data.mode == 'team' ? interaction.member._roles.find(n => teams.includes(n)) : interaction.user.id
      if (!id) return interaction.followUp({ embeds: [{ title: 'Nemáš žádnou týmovou roli!', description: `Pokud nějakou chceš, použij /verify!`, color: 15548997 }], ephemeral: true })
      
      let ids = data.answers.split('|').map(n => {return { ids: data[n], name: n}})
      let answered = ids.find(n => n.ids.includes(id));

      let admin = interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles) // MANAGE ROLES


      if (!select && data[answer].includes(id)) {
        data[answer] = data[answer].filter(n => n !== id)
        let embed = { title: 'Odstranení hlasu!', description: `Reakce: \`${answer}\`\nReacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
        console.discord(`Odstranění hlasu v \`${data.name || data._id}\`\n${embed.description}`)
      } else if (!select &&  (!answered || data.settings == 'duplicate')) {
        data[answer].push(id)
        let embed = { title: 'Přidání hlasu!', description: `Reakce: \`${answer}\`\nReacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
        console.discord(`Přidání hlasu v \`${data.name || data._id}\`\n${embed.description}`)
      } else if (!select) {
        data[answered.name] = data[answered.name].filter(n => n !== id)
        data[answer].push(id)
        let embed = { title: 'Změna hlasu!', description: `Z: \`${answered.name}\`\nNa: \`${answer}\`\nReacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
        console.discord(`Změna hlasu v \`${data.name || data._id}\`\n${embed.description}`)
      } else return interaction.followUp({ embeds: [getEmbed(data, { guild: interaction.guild, showId: admin ? undefined : id, show: admin })], ephemeral: true })

      await edge.post('general', 'events', data)

      let embed = getEmbed(data, { guild: interaction.guild })
      await interaction.message.edit({ embeds: [embed]})

      await edge.google.nahratData(data, {guild: interaction.guild})

      
    },
    deny: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let _id = interaction.customId.split('_')[3]

      await edge.delete('general', 'events', {_id: _id})
      interaction.editReply({ components: []})
    },
    accept: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let _id = interaction.customId.split('_')[3]

      let event = await edge.get('general', 'events', {_id: _id})
      if (!event.length) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Zkopíruj si zadání commandu a zkus to znova, nebo kontaktuj developera!`, color: 15548997 }], ephemeral: true })
      event = event[0]

      let channel = dc_client.channels.cache.get(event.channel)
      if (!channel) return interaction.followUp({ embeds: [{ title: 'ERROR', description: `Nenašel jsem kanál s id \`${event.channel}\``, color: 15548997 }], ephemeral: true })
      let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
      if (!access) return interaction.followUp({ embeds: [{ title: 'ERROR', description: `Nemám oprávnění posílat embed zprávy do ${channel}`, color: 15548997 }], ephemeral: true })

      let odpovedi = new ActionRowBuilder();
      for (let answer of event.answers.split('|')) {
        let styl = 2
        if (event.type == 'form' && answer == 'Accept') styl = 3
        else if (event.type == 'form' && answer == 'Deny') styl = 4
        odpovedi.addComponents(new ButtonBuilder().setCustomId(`${event.type || 'hlasovani'}_cmd_select_${event._id}_${answer}`).setStyle(styl).setLabel(answer).setDisabled(false))
      }
      if (event.type == 'form') odpovedi.addComponents(new ButtonBuilder().setCustomId(`form_cmd_editHandler_${event._id}`).setStyle(2).setLabel('EDIT'))

      let components = [odpovedi]
      if (event.settings == 'hide') components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`${event.type || 'hlasovani'}_cmd_select_${event._id}_select_select`).setStyle(3).setLabel('Zobrazit odpověď').setDisabled(false)))

      let message = await channel.send({ embeds: [getEmbed(event, {guild: interaction.guild})], components: components, content: `[<@&${edge.config.discord.roles.position_trener}>]`, allowedMentions: { parse: [/*'roles'*/]} })
      event.msgUrl = message.url
      event.message = message.id

      if (interaction.customId.split('_').length !== 4) interaction.editReply({ components: []})
      await edge.post('general', 'events', event)
    },
    getEmbed: getEmbed
}