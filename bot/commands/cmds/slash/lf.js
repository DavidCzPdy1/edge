
const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } = require('discord.js')
const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))


module.exports = {
  name: 'lf',
  description: 'Shows LF resluts!',
  permissions: [{ id: '378928808989949964', type: 'USER', permission: true }, { id: '1105555145456107581', type: 'ROLE', permission: true }, { id: '1105544649080320110', type: 'ROLE', permission: true }],
  guild: ['1105413744902811688'],
  options: [
    {
      name: 'turnaj',
      description: 'Jaký turnaj chceš vidět?',
      type: 3,
      required: true,
      autocomplete: true
    },
    {
      name: 'hrac',
      description: 'Jakou odpověď hráče chceš vidět?',
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

    let tourney = interaction.options.getString('turnaj')
    let data = tourney !== 'null' ? await edge.get('general', 'turnaj', { _id: tourney.replaceAll('_', '-') }).then(n => n[0]) : null
    if (!data) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyl nalezen žádný turnaj!`, color: 15548997 }] })

    let hrac = interaction.options.getString('hrac')
    if (hrac) {
      let player = data.players.find(n => n.user == hrac)
      if (hrac == 'null' || !player) return interaction.editReply({ content: 'Nebyl vybrán platný hráč!'})

      let embed = {title: 'Odpověď hráče/ky '+player.name, description: `**Jméno:** <@${player.user}>\n**Tým:** ${player.team && player.team !== 'ne' ? '<@&' + player.team + '>' : 'Žádný'}`, color: 15882495, fields: player.answer, footer: {text: 'Pokud s tímto hráčem/čkou počítaš, tak ho/jí prosím kotaktuj a zaškrtni tlačítko!'} }
      let button =  new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('lf_cmd_LFAccept_'+data._id+'_'+player.user).setLabel('Dal jsem hráči vědět a beru ho do týmu').setStyle(3))

      return interaction.editReply({ embeds: [embed], components: [button]})

    } else {
      let embed = {title: 'Seznam lidí, co hledají tým', description: 'Pro kontakrování / přijetí přidej daného hráče při posílání příkazu', color: 15882495, fields: data.players.filter(n => !n.accepted).map(n => ({name: n.name, value: n.answer.map(a => `${a.name} - ${a.value}`).join('\n')}))}
      return interaction.editReply({ embeds: [embed]})
    }
  

  },
  autocomplete: async (edge, interaction) => {
    let current = interaction.options._hoistedOptions.filter(n => n.focused)[0].name
    if (current !== 'turnaj' && !interaction.options.getString('turnaj')) return interaction.respond([{ name: 'Vyber nejdříve turnaj!', value: 'null' }])

    if (current == 'turnaj') {
      let turnaje = await edge.get('general', 'turnaj', {})
      turnaje = turnaje.filter(n => !n.ended && n.message)

      let show = turnaje.map(n => { return { name: n.name + ' ' + new Date(n.start).toISOString().substring(0, 10), value: n._id } })
      let focused = interaction.options.getFocused()

      let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25) 
      return interaction.respond( z.length ? z : [{ value: 'null', name: 'Nebyl nalezen žádný turnaj' }])
    } else if (current == 'hrac') {
      let data = await edge.get('general', 'turnaj', {_id: interaction.options.getString('turnaj').replaceAll('_', '-')}).then(n => n[0])
      if (!data) return interaction.respond([{ name: 'Nenašel jsem daný turnaj!', value: 'null' }])



      let show = data.players.filter(n => !n.accepted).map(n => { return { name: n.name, value: n.user } })
      let focused = interaction.options.getFocused()

      let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase()) || n.value.includes(focused)).slice(0, 25) 
      return interaction.respond( z.length ? z : [{ value: 'null', name: 'Nebyl nalezen žádný hráč' }])
    }
  },
  LFApply: async (edge, interaction) => {
    let id = interaction.customId.split('_')[3]
    let user = await edge.get('general', 'users', {_id: interaction.user.id}).then(n => n[0])
    if (!user) return interaction.reply({ ephemeral: true, content: `Nejsi verifikovaný! Použij prosím /verify`})


    const modal = new ModalBuilder().setCustomId('trenink_ignore_submit_'+id).setTitle(`LF Žádost!`)
      .addComponents(textBox({ id: 'Věk', text: 'Kolik ti je let?', example: 'Např. 13', value: undefined, required: true}))
      .addComponents(textBox({ id: 'Zkušenosti', text: 'Jaké máš zkušenosti s frisbee?', example: 'Např. jak dlouho hraješ, jaká je tvoje oblíbená role na hřišti, zkušenosti...', value: undefined, required: true, style: 2}))
      
    await interaction.showModal(modal);
    interaction = await interaction.awaitModalSubmit({filter: (n) => n.customId == 'trenink_ignore_submit_'+id, time: 180000}).catch(e => {})
    if (!interaction) return

    await interaction.deferReply({ ephemeral: true})

    let db = await edge.get('general', 'turnaj', {_id: id}).then(n => n[0])
    if (!db) return interaction.editReply({ content: 'ERROR - Nenašel jsem v databázi daný turnaj!'})

    if (db.players.find(a => a.user == interaction.user.id)) return interaction.editReply({ content: 'ERROR - Už jsi zapsasný, že hledáš turnaj!'})

    let result = interaction.fields.fields.map(n => { return {name: n.customId, value: n.value?.trim(), inline: true }}).filter(n => n.value.length)

    let player = {
      user: interaction.user.id,
      name: user.name,
      team: user.team,
      answer: result,
      accepted: false
    }
    
    db.players.push(player)
    
    await edge.post('general', 'turnaj', db)

    interaction.editReply({ content: 'Tvoje žádost byla přijata!'})
    let channel = dc_client.channels.cache.get('1105917930610368614') // trainer chat
    let embed = {title: `Nová odpověď v hledání týmu (LF) na "${db.name}"!`, description: `**Jméno:** <@${player.user}>\n**Tým:** ${player.team && player.team !== 'ne' ? '<@&' + player.team + '>' : 'Žádný'}`, color: 15882495, fields: player.answer }

    console.discord(`${interaction.user} přidal/a LF`)

    channel?.send({embeds: [embed]})
    

    
  },
  LFDelete: async (edge, interaction) => {
    await interaction.deferReply({ ephemeral: true})

    let id = interaction.customId.split('_')[3]

    let db = await edge.get('general', 'turnaj', {_id: id}).then(n => n[0])
    if (!db) return interaction.editReply({ content: 'ERROR - Nenašel jsem v databázi daný turnaj!'})

    if (!db.players.find(a => a.user == interaction.user.id)) return interaction.editReply({ content: 'ERROR - Nejsi zapsasný, že hledáš turnaj!'})

    db.players = db.players.filter(n => n.user !== interaction.user.id)

    await edge.post('general', 'turnaj', db)

    interaction.editReply({ content: 'Byla odstraněna tvoje žádost!'})
    console.discord(`${interaction.user} odstranil/a LF`)

  },
  LFAccept: async (edge, interaction) => {
    await interaction.deferReply({ ephemeral: true})

    let id = interaction.customId.split('_')[3]
    let player = interaction.customId.split('_')[4]

    let db = await edge.get('general', 'turnaj', {_id: id}).then(n => n[0])
    if (!db) return interaction.editReply({ content: 'ERROR - Nenašel jsem v databázi daný turnaj!'})

    let user = db.players.find(a => a.user == player)
    if (!user) return interaction.editReply({ content: 'Nenašel jsem hráče v databázi!'})
    
    user.accepted = true
    await edge.post('general', 'turnaj', db)

    interaction.editReply({ content: 'Daný hráč byl přijat a nebude se už zobrazovat!'})

    console.discord(`${interaction.user} přijal/a <@${player}> v LF`)

  }
 
}