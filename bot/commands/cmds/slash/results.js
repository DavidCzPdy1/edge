
const { ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder } = require('discord.js')
const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))


module.exports = {
  name: 'results',
  description: 'Shows resluts of forms!',
  permissions: [{ id: '378928808989949964', type: 'USER', permission: true }, { id: '1105555145456107581', type: 'ROLE', permission: true }],
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
    await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

    let ikona = interaction.guild.iconURL()
    let guild = dc_client.guilds.cache.get('1105413744902811688')
   // if (interaction.guild?.id !== '1105413744902811688') return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nejsi na EDGE DC!`, color: 15548997 }] })

    let data = interaction.options.getString('event')
    if (data !== 'null') data = await edge.get('general', 'events', { _id: data }).then(n => n[0])
    if (!data || data === 'null') return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyl nalezen žádný event!`, color: 15548997 }] })

    let odpoved = interaction.options.getString('answer')
    if (odpoved) {
      let answers = data.Accept.filter(n => n.id == odpoved)
      if (!answers.length) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyla nalezena žádná odpověď!`, color: 15548997 }] })

      let message = getEmbed(data, answers, guild)

      return await interaction.editReply(message)
    } 

    await interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyla vybrána odpověď!`, footer: { text: 'TODO: Přidat overall přehled'}, color: 15548997 }], components: [] })

  },
  autocomplete: async (edge, interaction) => {

    let current = interaction.options._hoistedOptions.filter(n => n.focused)[0].name
    if (current !== 'event' && !interaction.options.getString('event')) return interaction.respond([{ name: 'Vyber nejdříve event!', value: 'null' }])

    if (current == 'event') {
      let events = await edge.get('general', 'events', {})
      events = events.filter(n => n.type == 'form')

      let show = events.map(n => ({name: n.name ? (`${n.name} - ${new Date(n.created).toLocaleString('cs-CZ')}`) : n._id, value: n._id}))
      let focused = interaction.options.getFocused()

      let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25) 
      return interaction.respond( z.length ? z : [{ value: 'null', name: 'Nebyl nalezen žádný event' }])
    } else if (current == 'answer') {
      let event = interaction.options.getString('event')
      let data = await edge.get('general', 'events', { _id: event }).then(n => n.filter(n => n.type == 'form')[0])
      if (!data) return interaction.respond([{ name: 'Nenašel jsem daný event!', value: 'null' }])

      let guild = dc_client.guilds.cache.get('1105413744902811688')
      let show = []
      data.Accept.map(n => {
        let mention = data.mode == 'team' ? guild.roles.cache.get(n.id || n) : guild.members.cache.get(n.id || n)
        let name = mention?.name || mention?.nickname || mention?.user?.username
        return { name: name, value: n.id }
      }).forEach(n => {
        let answer = show.find(a => a.name == n.name)
        if (!answer) show.push(n)
        else if (!answer.name.endsWith(' 2x')) answer.name = answer.name + ` 2x`
      });

      let focused = interaction.options.getFocused()
      let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25)
      return interaction.respond(z.length ? z : [{ value: 'null', name: 'Nebyl nalezena žádná odpověď' }])
    }
  },
  edit: async (edge, interaction) => {
    let _id = interaction.customId.split('_')[3]
    let id = interaction.customId.split('_')[4]
    let time = interaction.customId.split('_')[5]

    let data = await edge.get('general', 'events', { _id: _id }).then(n => n[0])
    let answer = data.Accept.find(n => n.id == id && n.time == time)
    if (!answer) return interaction.reply({ embeds: [{ title: 'ERROR', description: `Nebyla nalezena žádná odpověď!`, color: 15548997 }], ephemeral: edge.isEphemeral(interaction) })
    
    /* create and send MODAL */
    const modal = new ModalBuilder().setCustomId('results_cmd_catchEdit_'+data._id+'_'+id+'_'+time).setTitle(`${data.name || data._id}`)
    for (let i = 0; i < data.questions.length; i++) {
      let question = data.questions[i]
      modal.addComponents(textBox({ id: String(i), text: question, example: undefined, value: answer.answers[question], required: i == data.questions.length - 1 ? false : true}))
    }
    await interaction.showModal(modal)

  },
  delete: async (edge, interaction) => {
    await interaction.update({ type:6 })

    let _id = interaction.customId.split('_')[3]
    let id = interaction.customId.split('_')[4]
    let time = interaction.customId.split('_')[5]

    let guild = dc_client.guilds.cache.get('1105413744902811688')

    let data = await edge.get('general', 'events', { _id: _id }).then(n => n[0])
    let answer = data.Accept.find(n => n.id == id && n.time == time)
    if (!answer) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyla nalezena žádná odpověď!`, color: 15548997 }], components: [] })

    data.Accept = data.Accept.filter(n => !(n.id == id && n.time == time))

    await edge.post('general', 'events', data)
    await interaction.editReply(getEmbed(data, data.Accept.filter(n => n.id == id), guild))
    await edge.google.nahratData(data, {guild: guild})

    if (data.message) {
      let embed = edge.commands.get('hlasovani').getEmbed(data, { guild: guild })
      let msg = await dc_client.channels.cache.get(data.channel)?.messages.fetch(data.message).catch(e => {})
      await msg?.edit({ embeds: [embed]})
    }
  },
  catchEdit: async (edge, interaction) => {
    await interaction.update({ type:6 })
    let _id = interaction.customId.split('_')[3]
    let id = interaction.customId.split('_')[4]
    let time = interaction.customId.split('_')[5]

    let guild = dc_client.guilds.cache.get('1105413744902811688')

    let data = await edge.get('general', 'events', { _id: _id }).then(n => n[0])
    let answer = data.Accept.find(n => n.id == id && n.time == time)
    if (!answer) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyla nalezena žádná odpověď!`, color: 15548997 }], components: [] })

    data.Accept = data.Accept.filter(n => !(n.id == id && n.time == time))

    let answers = interaction.fields.fields.map(n => {return {name: n.customId, value: n.value?.trim()}}).filter(n => n.value.length)
    let odpovedi = {}
    for (const odpoved of answers) {
      odpovedi[data.questions[odpoved.name]] = odpoved.value
    }
    answer.answers = odpovedi
    answer.edited = interaction.user.id
    data.Accept.push(answer)

    data.Accept = data.Accept.sort((a, b) => a.time-b.time)

    await edge.post('general', 'events', data)
    await interaction.editReply(getEmbed(data, data.Accept.filter(n => n.id == id), guild))
    await edge.google.nahratData(data, {guild: guild})

    if (data.message) {
      let embed = edge.commands.get('hlasovani').getEmbed(data, { guild: guild })
      let msg = await dc_client.channels.cache.get(data.channel)?.messages.fetch(data.message).catch(e => {})
      await msg?.edit({ embeds: [embed]})
    }
  }
}

function getEmbed(data, answers, guild) {
  if (!answers.length) return { embeds: [{ title: `**${data.name || data._id}**`, description: 'Žádná odpověď'}], components: [] }
  let mention = data.mode == 'team' ? guild.roles.cache.get(answers[0].id) : guild.members.cache.get(answers[0].id)
  let name = mention?.name || mention?.nickname || mention?.user?.username
  let embed = { title: `Answer by ${name}`, description: `**${data.name || data._id}**\n*${answers.length}/${data.numberAnswers} answer${data.numberAnswers > 1 ? 's' : ''}*`, fields: [], footer: {}}
  let components = []    

  for (let answer of answers) {
    let fields = [{name: 'ㅤ', value: 'ㅤ', inline: false}, ...Object.keys(answer.answers).map(n => { return {name: n, value: `\`${answer.answers[n]}\``, inline: false}})]

    embed.fields = [...embed.fields, ...fields]

    let reacted = guild.members.cache.get(answer.by)?.nickname || guild.members.cache.get(answer.by)?.user?.username
    if (!embed.footer.text) embed.footer.text = `Reacted by ${reacted}`
    else if (!embed.footer.text.includes(reacted)) embed.footer.text = embed.footer.text + ` & ${reacted}`

    
    let buttons = new ActionRowBuilder() 
    .addComponents(new ButtonBuilder().setCustomId(`results_cmd_edit_${data._id}_${answer.id}_${answer.time}`).setStyle(2).setLabel('UPDATE'))
    .addComponents(new ButtonBuilder().setCustomId(`results_cmd_delete_${data._id}_${answer.id}_${answer.time}`).setStyle(4).setLabel('DELETE'))
    components.push(buttons)
  }
  return {embeds: [embed], components: components}
}