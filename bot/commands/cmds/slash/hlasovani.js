
const { ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder, PermissionsBitField } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }

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
        description: 'Jak často mám upomínat členy týmů? (number - hours)',
        type: 3,
        required: false
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let action = interaction.options.getString('action')
      let data = {
        question: interaction.options.getString('question').replaceAll('_', ' '),
        description: interaction.options.getString('description'),
        answers: interaction.options.getString('answers'),
        time: interaction.options.getString('time') || null,
        mode: interaction.options.getString('mode') || 'team',
        type: 'poll',
        channel: '1105918656203980870',
        perms: 'trener',
        pings: Number(interaction.options.getString('pings')) || 0
      }

      let events = await edge.get('general', 'events', {_id: data.question})
      let errorEmbed = { title: `ERROR! Použij příkaz znovu: </${interaction.commandName}:${interaction.commandId}>`, description: `Hlasování nebo event s tímto názvem už existuje!`, fields: Object.keys(data).filter(n => data[n]).map(n => {return{ name: n, value: `\`${data[n]}\``, inline: true}}), color: 15548997, footer: { icon_url: interaction?.guild?.iconURL() || '', text: 'EDGE Discord'} }
      if (events.length) return interaction.editReply({ embeds: [errorEmbed]})

      let answers = data.answers.split('|')
      let embed = {
        title: data.question,
        description: data.description,
        fields: answers.map(n => { return {name: `${n.trim()} - 0`, value: `\u200B`, inline: true} }),
        color: 1613
      }

      if (embed.fields.length > 5) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Je zadáno moc odpovědí! (${embed.fields.length})`)]})

      if (data.time) {
        let time = data.time.split('.').map(n => n.trim())
        let cas = [time[2], time[1].length == 1 ? `0${time[1]}` : time[1], time[0].length == 1 ? `0${time[0]}`: time[0] ]
        let c = Date.parse(`${cas[0]}-${cas[1]}-${cas[2]} 23:59`)
        data.time = c
        embed.timestamp = new Date(c),
        embed.footer = { text: 'Konec hlasování'}

        embed.description = embed.description + `\n**Time:** <t:${c/1000}:R>`
        if (data.mode == 'team') embed.description = embed.description + `\n*Hlasuje se za tým*`

        if (c < new Date().getTime()) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Zadaný čas už byl!`)]})
        else if (c - 1000*60*60*20 < new Date().getTime()) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Zadaný čas je dřív než za 20 hodin!`)]})
      } else data.finished = -1;

      let odpovedi = new ActionRowBuilder();

      for (let answer of answers) {
        odpovedi.addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_select_${data.question}_${answer}`).setStyle(2).setLabel(answer).setDisabled(true))
        data[answer] = []
      }

      let accept = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_deny_${data.question}`).setStyle(4).setLabel('NEPOSLAT'))
        .addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_accept_${data.question}`).setStyle(3).setLabel('POSLAT'))
    
      data._id = data.question
      delete data.question

      await edge.post('general', 'events', data)
      let souhrn = Object.keys(data).map(n => { return {name: n, value: data[n], inline: true}}).filter(n => typeof n.value === 'string' || typeof n.value === 'number')
      await interaction.editReply({ embeds: [{ title: 'Souhrn:', fields: souhrn, color: 2982048}], ephemeral: true})
      await interaction.followUp({ embeds: [embed], components: [odpovedi, accept], ephemeral: true})

    },
    select: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]
      let answer = interaction.customId.split('_')[4]

      let data = await edge.get('general', 'events', {_id: question})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      let access = interaction.member._roles.includes(edge.config.discord.roles[`position_${data.perms || 'trener'}`])
      if (!access) return interaction.followUp({ embeds: [{ title: 'Nemáš potřebné oprávnění na reakci!', description: `Potřebuješ <@&${edge.config.discord.roles[`position_${data.perms}`]}>`, color: 15548997 }], ephemeral: true })

      let id = data.mode == 'team' ? interaction.member._roles.find(n => Object.keys(edge.config.discord.roles).filter(a => a.startsWith('club_')).map(a => edge.config.discord.roles[a]).includes(n)) : interaction.user.id
      if (!id) return interaction.followUp({ embeds: [{ title: 'Nemáš žádnou týmovou roli!', description: `Pokud nějakou chceš, použij /verify!`, color: 15548997 }], ephemeral: true })
      
      let ids = data.answers.split('|').map(n => {return { ids: data[n], name: n}})
      let answered = ids.find(n => n.ids.includes(id));


      if (data[answer].includes(id)) {
        data[answer] = data[answer].filter(n => n !== id)
        let embed = { title: 'Odstranení hlasu!', description: `Reakce: \`${answer}\`\nReacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
        console.discord(`Přidání hlasu v \`${question}\`\n${embed.description}`)
      } else if (!answered) {
        data[answer].push(id)
        let embed = { title: 'Přidání hlasu!', description: `Reakce: \`${answer}\`\nReacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
        console.discord(`Přidání hlasu v \`${question}\`\n${embed.description}`)
      } else {
        data[answered.name] = data[answered.name].filter(n => n !== id)
        data[answer].push(id)
        let embed = { title: 'Změna hlasu!', description: `Z: \`${answered.name}\`\nNa: \`${answer}\`\nReacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }
        interaction.followUp({ embeds: [embed], ephemeral: true })
        console.discord(`Změna hlasu v \`${question}\`\n${embed.description}`)
      }

      await edge.post('general', 'events', data)

      let embed = interaction.message.embeds[0].data

      embed.fields = embed.fields.map(n => {
        let name = n.name.split(' - ')[0] + ` - ${data[n.name.split(' - ')[0]].length}`
        let value = data[n.name.split(' - ')[0]].map(n => { return  (data.mode == 'team' ?  `<@&${n}>` :  `<@${n}>`)}).join('\n')
        if (!value.length) value = '\u200B'
        return {name: name, value: value, inline: true}
      })
      await interaction.message.edit({ embeds: [embed]})

      
    },
    deny: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]

      await edge.delete('general', 'events', {_id: question})
      interaction.editReply({ components: []})
    },
    accept: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]

      

      let event = await edge.get('general', 'events', {_id: question})
      if (!event.length) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Zkopíruj si zadání commandu a zkus to znova!`, color: 15548997 }], ephemeral: true })
      event = event[0]

      let channel = dc_client.channels.cache.get(event.channel)
      if (!channel) return interaction.followUp({ embeds: [{ title: 'ERROR', description: `Nenašel jsem kanál s id \`${event.channel}\``, color: 15548997 }], ephemeral: true })
      let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
      if (!access) return interaction.followUp({ embeds: [{ title: 'ERROR', description: `Nemám oprávnění posílat zprávy do ${channel}`, color: 15548997 }], ephemeral: true })

      answers = interaction.message.components[0]
      answers.components.forEach(n => n.data.disabled = false)

      let message = await channel.send({ embeds: [interaction.message.embeds[0].data], components: [answers], content: `[<@&${edge.config.discord.roles.position_trener}>]`, allowedMentions: { parse: []} })

      event.message = message.id

      interaction.editReply({ components: []})
      await edge.post('general', 'events', event)
    }
}