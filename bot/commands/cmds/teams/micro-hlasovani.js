
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }
const getEmbed = (data, options = {}) => {
  let embed =  {
      title: data.question || data._id,
      description: data.description,
      fields: data.answers?.split('|').map(n => { return {name: `${n.trim()} - 0`, value: `\u200B`, inline: true} }) || [],
      color: 14666022,
  }

  if (options.guild) {
    embed.fields = embed.fields.map(n => {
      let name = n.name.split(' - ')[0] + ` - ${data[n.name.split(' - ')[0]].length}`
      let value = data[n.name.split(' - ')[0]].map(a => {
        let id = a.id || a
        if (data.format == 'mention') return `<@${id}>`
        let mention = options.guild.members.cache.get(id)
        return mention?.nickname || mention?.user?.username
      }).join('\n')
      if (!value.length) value = '\u200B'
      return {name: name, value: value, inline: true}
    })
  }
  return embed
}

module.exports = {
    name: 'micro-hlasovani',
    description: 'Creates new question!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1128308482160996453', type: 'ROLE', permission: true}],
    guild: ['1128307451066855515'],
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
        name: 'format',
        description: 'Formátování odpovědí',
        type: 3,
        required: false,
        choices: [
          { value: 'text', name: 'Text' },
          { value: 'mention', name: 'Označení' },
        ]
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let data = {
        question: interaction.options.getString('question').replaceAll('_', ' '),
        description: interaction.options.getString('description'),
        answers: interaction.options.getString('answers').replaceAll('.', '/'),
        time: null,
        mode: interaction.options.getString('mode') || 'user',
        type: 'hlasovani',
        channel: '1123221519150088204',
        pings: 0,
        pingsData: [],
        created: new Date().getTime(),
        format: interaction.options.getString('format') || 'mention'||'text'
      }

      data.answers = data.answers.replaceAll('-', '➜').split('|').filter((item, pos) => data.answers.split('|').indexOf(item) == pos).join('|')

      let events = await edge.get('podebrady', 'events', {}).then(n => n.filter(a => a._id.toLowerCase() == data.question.toLowerCase()))
      let errorEmbed = { title: `ERROR! Použij příkaz znovu: </${interaction.commandName}:${interaction.commandId}>`, description: `Hlasování nebo event s tímto názvem už existuje!`, fields: Object.keys(data).filter(n => data[n]).map(n => {return{ name: n, value: `\`${data[n]}\``, inline: true}}), color: 15548997, footer: { icon_url: interaction?.guild?.iconURL() || '', text: 'EDGE Discord'} }
      if (events.length) return interaction.editReply({ embeds: [errorEmbed]})
      

      data.finished = -1;

      let embed = getEmbed(data)
      if (embed.fields.length > 5) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Je zadáno moc odpovědí! (${embed.fields.length})`)]})

      let odpovedi = new ActionRowBuilder();

      for (let answer of data.answers.split('|')) {
        odpovedi.addComponents(new ButtonBuilder().setCustomId(`micro-hlasovani_cmd_select_${data.question}_${answer}`).setStyle(2).setLabel(answer).setDisabled(true))
        data[answer] = []
      }

      let accept = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`micro-hlasovani_cmd_accept_${data.question}`).setStyle(3).setLabel('POSLAT'))
        .addComponents(new ButtonBuilder().setCustomId(`micro-hlasovani_cmd_deny_${data.question}`).setStyle(4).setLabel('NEPOSLAT'))
        
    
      data._id = data.question
      delete data.question

      await edge.post('podebrady', 'events', data)

      let souhrn = Object.keys(data).map(n => { return {name: n, value: data[n], inline: true}}).filter(n => typeof n.value === 'string' || typeof n.value === 'number')
      await interaction.editReply({ embeds: [{ title: 'Souhrn:', fields: souhrn, color: 2982048}], ephemeral: true})
      await interaction.followUp({ embeds: [embed], components: [odpovedi, accept], ephemeral: true})

    },
    select: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]
      let answer = interaction.customId.split('_')[4]

      let data = await edge.get('podebrady', 'events', {_id: question})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
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

      await edge.post('podebrady', 'events', data)

      let embed = getEmbed(data, { guild: interaction.guild })
      await interaction.message.edit({ embeds: [embed]})
    },
    deny: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]

      await edge.delete('podebrady', 'events', {_id: question})
      interaction.editReply({ components: []})
    },
    accept: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]

      let event = await edge.get('podebrady', 'events', {_id: question})
      if (!event.length) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Zkopíruj si zadání commandu a zkus to znova, nebo kontaktuj developera!`, color: 15548997 }], ephemeral: true })
      event = event[0]

      let channel = dc_client.channels.cache.get(event.channel)
      if (!channel) return interaction.followUp({ embeds: [{ title: 'ERROR', description: `Nenašel jsem kanál s id \`${event.channel}\``, color: 15548997 }], ephemeral: true })
      let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
      if (!access) return interaction.followUp({ embeds: [{ title: 'ERROR', description: `Nemám oprávnění posílat embed zprávy do ${channel}`, color: 15548997 }], ephemeral: true })

      let odpovedi = new ActionRowBuilder();
      for (let answer of event.answers.split('|')) {
        let styl = 2
        odpovedi.addComponents(new ButtonBuilder().setCustomId(`micro-hlasovani_cmd_select_${event._id}_${answer}`).setStyle(styl).setLabel(answer).setDisabled(false))
      }

      let message = await channel.send({ embeds: [getEmbed(event, {guild: interaction.guild})], components: [odpovedi], content: `[<@&1128309507190181928>]`, allowedMentions: { parse: ['roles']} })
      event.msgUrl = message.url
      event.message = message.id

      await edge.post('podebrady', 'events', event)
    },
    dochazka: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let _id = interaction.customId.split('_')[3]
      let answer = interaction.customId.split('_')[4]

      let data = await edge.get('podebrady', 'treninky', {_id: _id})
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

      await edge.post('podebrady', 'treninky', data)

      let embed = getEmbed(data, { guild: interaction.guild })
      await interaction.message.edit({ embeds: [embed]})
    },
    treninkEdit: async (edge, interaction) => {
      await interaction.update({ type:6 })

      let _id = interaction.customId.split('_')[3]
      let data = await edge.get('podebrady', 'treninky', {_id: _id})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný trénink!', description: `Už není v databázi!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      //console.log(interaction)

      let toggleRole = interaction.roles?.first()?.name
      if (!toggleRole || !toggleRole.startsWith('Edit ') || interaction.roles.size > 1) return interaction.followUp({ embeds: [{ title: 'Chybné použití!', description: `Musíš zvolit jednu z edit rolí:\n<@&1128309187001208872>/<@&1128309223038664754>/<@&1128309248837812254>`, color: 15548997 }], ephemeral: true })
      let answer = toggleRole.replace('Edit ', '')

      if (interaction.users?.size < 1) return interaction.followUp({ embeds: [{ title: 'Chybné použití!', description: `Musíš zvolit více než jednoho uživatele!`, color: 15548997 }], ephemeral: true })

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
          edited.push(`${name} - změna hlasu z \`${answered.name}\` na: \`${answer}\``)
        }
      }

      await edge.post('podebrady', 'treninky', data)
      await interaction.editReply({ embeds: [getEmbed(data, {guild: interaction.roles?.first()?.guild})]})
      await interaction.followUp({ embeds: [{title: `Úprava tréninku, který už skončil!`, description: `**Zpráva:** [${data.question}](${interaction.message.url})\n\n` + edited.join('\n'), color: 14666022}], ephemeral: true })
    }
}