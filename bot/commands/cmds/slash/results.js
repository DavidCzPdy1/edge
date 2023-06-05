
const { ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder } = require('discord.js')

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
    await interaction.deferReply({ ephemeral: true })

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

    await interaction.editReply({ embeds: [embed], components: [] })

  },
  autocomplete: async (edge, interaction) => {

    let current = interaction.options._hoistedOptions.filter(n => n.focused)[0].name
    if (current !== 'event' && !interaction.options.getString('event')) return interaction.respond([{ name: 'Vyber nejdříve event!', value: 'null' }])

    if (current == 'event') {
      let tymy = await edge.get('general', 'events', {})
      tymy = tymy.filter(n => n.type == 'form')

      let show = tymy.map(n => { return { name: n._id, value: n._id } })
      let focused = interaction.options.getFocused()

      return interaction.respond(show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25) || [{ value: 'null', name: 'Nebyl nalezen žádný event' }])
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
      }).forEach(n => { if (!show.find(a => a.name = n.name)) show.push(n) });

      let focused = interaction.options.getFocused()
      return interaction.respond(show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25) || [{ value: 'null', name: 'Nebyl nalezena žádná odpověď' }])
    }
  },
  edit: async (edge, interaction) => {
    let title = interaction.customId.split('_')[3]
    let id = interaction.customId.split('_')[4]
    let time = interaction.customId.split('_')[5]

    let message = interaction.message

    let data = await edge.get('general', 'events', { _id: title }).then(n => n[0])
    let answer = data.Accept.find(n => n.id == id && n.time == time)
    if (!answer) return interaction.reply({ embeds: [{ title: 'ERROR', description: `Nebyla nalezena žádná odpověď!`, color: 15548997 }] })
    
    let guild = dc_client.guilds.cache.get('1105413744902811688')

    await message.edit(getEmbed(data, data.Accept.filter(n => n.id == id), guild))

    //await interaction.update({ type:6 })
    console.log(answer)
  },
  delete: async (edge, interaction) => {
    await interaction.update({ type:6 })

    let title = interaction.customId.split('_')[3]
    let id = interaction.customId.split('_')[4]
    let time = interaction.customId.split('_')[5]

    let guild = dc_client.guilds.cache.get('1105413744902811688')

    let data = await edge.get('general', 'events', { _id: title }).then(n => n[0])
    let answer = data.Accept.find(n => n.id == id && n.time == time)
    if (!answer) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyla nalezena žádná odpověď!`, color: 15548997 }], components: [] })

    data.Accept = data.Accept.filter(n => !(n.id == id && n.time == time))

    await edge.post('general', 'events', data)
    await interaction.editReply(getEmbed(data, data.Accept.filter(n => n.id == id), guild))
  }
}

function getEmbed(data, answers, guild) {
  if (!answers.length) return { embeds: [{ title: `**${data._id}**`, description: 'Žádná odpověď'}], components: [] }
  let mention = data.mode == 'team' ? guild.roles.cache.get(answers[0].id) : guild.members.cache.get(answers[0].id)
  let name = mention?.name || mention?.nickname || mention?.user?.username
  let embed = { title: `Answer by ${name}`, description: `**${data._id}**\n*${answers.length}/${data.numberAnswers} answer${data.numberAnswers > 1 ? 's' : ''}*`, fields: [], footer: {}}
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