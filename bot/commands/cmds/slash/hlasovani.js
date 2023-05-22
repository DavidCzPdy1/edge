
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
        channel: '1105918656203980870'
      }

      let events = await edge.get('general', 'events', {_id: data.question})
      let errorEmbed = { title: `ERROR! Použij příkaz znovu: </${interaction.commandName}:${interaction.commandId}>`, description: `Hlasování nebo event s tímto názvem už existuje!`, fields: Object.keys(data).filter(n => data[n]).map(n => {return{ name: n, value: `\`${data[n]}\``, inline: true}}), color: 15548997, footer: { icon_url: interaction?.guild?.iconURL() || '', text: 'EDGE Discord'} }
      if (events.length) return interaction.editReply({ embeds: [errorEmbed]})

      let answers = data.answers.split('|')
      let embed = {
        title: data.question,
        description: data.description,
        fields: answers.map(n => { return {name: `${n.trim()} (0)`, value: `\u200B`, inline: true} }),
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

        if (c < new Date().getTime()) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Zadaný čas už byl!`)]})
        else if (c - 1000*60*60*20 < new Date().getTime()) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Zadaný čas je dřív než za 20 hodin!`)]})
      }

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
      await interaction.editReply({ embeds: [embed], components: [odpovedi, accept]})
    

    },
    select: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let question = interaction.customId.split('_')[3]
      let asnwer = interaction.customId.split('_')[4]

      
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