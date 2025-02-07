
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }
const getEmbed = (data, options = {}) => {
  let embed =  {
      title: data.title || data.name || data.question || data._id,
      description: data.description,
      fields: data.answers?.split('|').map(n => { return {name: `${n.trim()} - 0`, value: `\u200B`, inline: true} }) || [],
      color: data.color|| 14666022,
  }

  if (data.settings == 'duplicate') embed.description = embed.description + `\n*Hlasuje se neomezeně*`
  if (data.settings == 'hide') embed.description = embed.description + `\n*Hlasuje se skrytě*`

  if (options.guild) {
    embed.fields = embed.fields.map(n => {
      let name = n.name.split(' - ')[0] + ` - ${data[n.name.split(' - ')[0]].filter(a => options.showId ? (a?.id || a) == options.showId : true).length}`
      let value = data[n.name.split(' - ')[0]].filter(a => options.showId ? (a?.id || a) == options.showId : true).map(a => {
        let id = a.id || a
        if (data.format == 'mention') return `<@${id}>`
        let mention =  options.verify?.find(c => c._id == id) || options.guild.members.cache.get(id) || {nickname: id}
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
    name: 'team-anketa',
    description: 'Creates new question!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: ['Administrator'], type: 'PERMS', permission: true }, { id: '1142176186349387877', type: 'ROLE', permission: true},  { id: '1142175286352416819', type: 'ROLE', permission: true}],
    guild: ['1128307451066855515', '1122995611621392424'],
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
        name: 'channel',
        description: 'Kam chceš anketu poslat?',
        type: 7,
        required: true
      },
      {
        name: 'format',
        description: 'Formátování odpovědí',
        type: 3,
        required: false,
        choices: [
          { value: 'text', name: 'Text' },
          { value: 'mention', name: 'Označení' },
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
      await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

      let data = {
        _id: String(new Date().getTime()),
        question: interaction.options.getString('question').replaceAll('_', ' '),
        description: interaction.options.getString('description')?.split(';').join('\n'),
        answers: interaction.options.getString('answers').replaceAll('.', '/').replaceAll('-', '➜'),
        time: null,
        mode: 'user',
        type: 'hlasovani',
        settings: interaction.options.getString('settings') || 'show',
        pings: 0,
        pingsData: [],
        created: new Date().getTime(),
        channel: interaction.options.getChannel('channel')?.id || null,
        format: interaction.options.getString('format') ||'text' || 'mention'
      }

      let team = await edge.get('general', 'clubs').then(n => n.find(a => a.server?.guild === interaction.guild.id))
      if (!team) return interaction.editReply({ content: '**ERROR!** Nenašel jsem daný dc server v club databázi!'})

      data.color = team.color
      data.content = team.server.ping?.annoucment ? `[<@&${team.server.ping.annoucment}>]` : undefined
      if (!data.channel) data.channel = team.server?.channels?.annoucment
      data.answers = data.answers.replaceAll('-', '➜').split('|').filter((item, pos) => data.answers.split('|').indexOf(item) == pos).join('|')
      data.finished = -1;

      let errorEmbed = { title: `ERROR! Použij příkaz znovu: </${interaction.commandName}:${interaction.commandId}>`, description: `Není nadefinovaný channel!\nKontaktuj prosím developera`, fields: Object.keys(data).filter(n => data[n]).map(n => {return{ name: n, value: `\`${data[n]}\``, inline: true}}), color: 15548997, footer: { icon_url: interaction?.guild?.iconURL() || '', text: 'EDGE Discord'} }
      if (!data.channel) return interaction.editReply({ embeds: [errorEmbed]})  

      let embed = getEmbed(data)
      if (embed.fields.length > 5) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Je zadáno moc odpovědí! (${embed.fields.length})`)]})

      let odpovedi = new ActionRowBuilder();

      for (let answer of data.answers.split('|')) {
        odpovedi.addComponents(new ButtonBuilder().setCustomId(`team-anketa_cmd_select_${team.server.database}_${data._id}_${answer}`).setStyle(2).setLabel(answer).setDisabled(true))
        data[answer] = []
      }

      let accept = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`team-anketa_cmd_accept_${team.server.database}_${data._id}`).setStyle(3).setLabel('POSLAT'))
        .addComponents(new ButtonBuilder().setCustomId(`team-anketa_cmd_deny_${team.server.database}_${data._id}`).setStyle(4).setLabel('NEPOSLAT'))
        .addComponents(new ButtonBuilder().setCustomId(`edit_cmd_sendModal_${data._id}_basic`).setStyle(2).setLabel('Základní EDIT'))
        .addComponents(new ButtonBuilder().setCustomId(`edit_cmd_sendModal_${data._id}_results`).setStyle(2).setLabel('EDIT Odpovědí'))

      await edge.post('teams', team.server.database, data)

      let souhrn = Object.keys(data).map(n => { return {name: n, value: data[n], inline: true}}).filter(n => typeof n.value === 'string' || typeof n.value === 'number')
      await interaction.editReply({ embeds: [{ title: 'Souhrn:', fields: souhrn, color: 2982048}], ephemeral: edge.isEphemeral(interaction)})
      await interaction.followUp({ embeds: [embed], components: [odpovedi, accept], ephemeral: edge.isEphemeral(interaction)})

    },
    select: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let db = interaction.customId.split('_')[3]
      let _id = interaction.customId.split('_')[4]
      let answer = interaction.customId.split('_')[5]
      let select = interaction.customId.split('_')[6] === interaction.customId.split('_')[5]

      let data = await edge.get('teams', db, {_id: _id})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      let id = interaction.user.id

      let ids = data.answers.split('|').map(n => {return { ids: data[n], name: n}})
      let answered = ids.find(n => n.ids.includes(id));

      let admin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) // ADMINISTRATOR

      if (!select && data[answer].includes(id)) {
        data[answer] = data[answer].filter(n => n !== id)
        let embed = { title: 'Odstranení hlasu!', description: `Reakce: \`${answer}\`\nReacted as <@${id}>`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
      } else if (!select &&  (!answered || data.settings == 'duplicate')) {
        data[answer].push(id)
        let embed = { title: 'Přidání hlasu!', description: `Reakce: \`${answer}\`\nReacted as <@${id}>`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
      } else if (!select) {
        data[answered.name] = data[answered.name].filter(n => n !== id)
        data[answer].push(id)
        let embed = { title: 'Změna hlasu!', description: `Z: \`${answered.name}\`\nNa: \`${answer}\`\nReacted as <@${id}>`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
      } else return interaction.followUp({ embeds: [getEmbed(data, { guild: interaction.guild, showId: admin ? undefined : id, show: admin })], ephemeral: true })

      await edge.post('teams', db, data)

      let embed = getEmbed(data, { guild: interaction.guild, verify: data.format == 'text' ? await edge.get('general', 'users', {}) : undefined })
      await interaction.message.edit({ embeds: [embed]})
    },
    deny: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let db = interaction.customId.split('_')[3]
      let _id = interaction.customId.split('_')[4]

      await edge.delete('teams', db, {_id: _id})
      interaction.editReply({ components: []})
    },
    accept: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let db = interaction.customId.split('_')[3]
      let _id = interaction.customId.split('_')[4]

      let event = await edge.get('teams', db, {_id: _id})
      if (!event.length) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Zkopíruj si zadání commandu a zkus to znova, nebo kontaktuj developera!`, color: 15548997 }], ephemeral: edge.isEphemeral(interaction) })
      event = event[0]

      let channel = interaction.guild.channels.cache.get(event.channel)
      if (!channel) return interaction.followUp({ embeds: [{ title: 'ERROR', description: `Nenašel jsem kanál s id \`${event.channel}\``, color: 15548997 }], ephemeral: edge.isEphemeral(interaction) })
      let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
      if (!access) return interaction.followUp({ embeds: [{ title: 'ERROR', description: `Nemám oprávnění posílat embed zprávy do ${channel}`, color: 15548997 }], ephemeral: edge.isEphemeral(interaction) })

      let odpovedi = new ActionRowBuilder();
      for (let answer of event.answers.split('|')) {
        let styl = 2
        odpovedi.addComponents(new ButtonBuilder().setCustomId(`team-anketa_cmd_select_${db}_${event._id}_${answer}`).setStyle(styl).setLabel(answer).setDisabled(false))
      }

      let components = [odpovedi]
      if (event.settings == 'hide') components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`team-anketa_cmd_select_${db}_${event._id}_select_select`).setStyle(3).setLabel('Zobrazit odpověď').setDisabled(false)))

      let message = await channel.send({ embeds: [getEmbed(event, {guild: interaction.guild, verify: event.format == 'text' ? await edge.get('general', 'users', {}) : undefined})], components: components, content: event.content, allowedMentions: { parse: ['roles']} })
      event.msgUrl = message.url
      event.message = message.id

      await edge.post('teams', db, event)
    },
    dochazka: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let db = interaction.customId.split('_')[3]
      let _id = interaction.customId.split('_')[4]
      let answer = interaction.customId.split('_')[5]
      let shorten = interaction.customId.split('_')[6]

      let data = []

      if (!shorten) data = await edge.get('teams', db, {_id: _id})
      else data = await edge.get('teams', db, {}).then(n => n.filter(a => a.created == _id))
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný trénink!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      let id = interaction.user.id

      let ids = data.answers.split('|').map(n => {return { ids: data[n], name: n}})
      let answered = ids.find(n => n.ids.includes(id));

      if (data[answer].includes(id)) {
        data[answer] = data[answer].filter(n => n !== id)
        let embed = { title: 'Odstranení hlasu!', description: `Reakce: \`${answer}\`\nReacted as <@${id}>`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
      } else if (!answered) {
        data[answer].push(id)
        let embed = { title: 'Přidání hlasu!', description: `Reakce: \`${answer}\`\nReacted as <@${id}>`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
      } else {
        data[answered.name] = data[answered.name].filter(n => n !== id)
        data[answer].push(id)
        let embed = { title: 'Změna hlasu!', description: `Z: \`${answered.name}\`\nNa: \`${answer}\`\nReacted as <@${id}>`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
      }

      if (data.type == 'turnaj' && data.role) {
        let role = interaction.guild.roles.cache.get(data.role)
        if (role) {
          if (data.Pojedu?.includes(id) || data['Uvidím']?.includes(id)) edge.discord.roles.roleAdd(interaction.member, role)
          else edge.discord.roles.roleRemove(interaction.member, role)
        } else console.error('Turnaj - nenašel jsem roli - ' + db)
      }


      await edge.post('teams', db, data)

      let embed = getEmbed(data, { guild: interaction.guild, verify: data.format == 'text' ? await edge.get('general', 'users', {}) : undefined })
      await interaction.message.edit({ embeds: [embed]})

      if (Number(new Date(data.start) - Number(new Date())) < 1000*60*60*8) { // 8 hodin
        if (!data?.archive) return;
        
        await dc_client.channels.cache.get(data?.archive)?.send({content: `[Změna hlasu!](${interaction.message.url})\nKdo:<@${id}>\nPůvodní odpověď:\`${answered.name}\`\nAktuální odpověď: \`${answer}\``})
        await interaction.user.send({content: `[Změna hlasu!](${interaction.message.url})\nPůvodní odpověď:\`${answered.name}\`\nAktuální odpověď: \`${answer}\`\n\n# PŘÍŠTĚ PROSÍM HLASUJ DŘÍV`})
        
      }
    },
    treninkEdit: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let db = interaction.customId.split('_')[3]
      let _id = interaction.customId.split('_')[4]
      let data = await edge.get('teams', db, {_id: _id})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný trénink!', description: `Už není v databázi!`, color: 15548997 }], ephemeral: edge.isEphemeral(interaction) })
      data = data[0]


      let toggleRole = interaction.roles?.first()?.name
      if (!toggleRole || !toggleRole.startsWith('Edit ') || interaction.roles.size > 1) return interaction.followUp({ embeds: [{ title: 'Chybné použití!', description: `Musíš zvolit jednu z edit rolí!`, color: 15548997 }], ephemeral: edge.isEphemeral(interaction) })
      let answer = toggleRole.replace('Edit ', '')

      if (interaction.users?.size < 1) return interaction.followUp({ embeds: [{ title: 'Chybné použití!', description: `Musíš zvolit více než jednoho uživatele!`, color: 15548997 }], ephemeral: edge.isEphemeral(interaction) })

      let edited = []
      for (let member of interaction.members) {
        member = member[1]
        let ids = data.answers.split('|').map(n => {return { ids: data[n], name: n}})

        let id = member.id
        let answered = ids.find(n => n.ids.includes(id));

        let name = data.format == 'mention' ? `<@${id}>` : member?.nickname || mention?.user?.username

        if (data[answer].includes(id)) {
          data[answer] = data[answer].filter(n => n !== id)
          edited.push(`${name} - odstranění \`${answer}\` hlasu`)
        } else if (!answered) {
          data[answer].push(id)
          edited.push(`${name} - přidání \`${answer}\` hlasu`)
        } else {
          data[answered.name] = data[answered.name].filter(n => n !== id)
          data[answer].push(id)
          edited.push(`${name} - změna hlasu z \`${answered.name}\` na \`${answer}\``)
        }
      }

      await edge.post('teams', db, data)
      await interaction.editReply({ embeds: [getEmbed(data, {guild: interaction.roles?.first()?.guild, verify: data.format == 'text' ? await edge.get('general', 'users', {}) : undefined})]})
      await interaction.followUp({ embeds: [{title: `Úprava tréninku, který už skončil!`, description: `**Zpráva:** [${data.name}](${interaction.message.url})\n\n` + edited.join('\n'), color: 14666022}], ephemeral: edge.isEphemeral(interaction) })
    },
    getEmbed: getEmbed
}