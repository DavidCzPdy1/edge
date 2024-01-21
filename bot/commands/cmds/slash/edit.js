
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder } = require('discord.js')

const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

const dbs = {
  '1105413744902811688': {db: 'general', name: 'events', filter: {}},
  '1128307451066855515': {db: 'teams', name: 'podebrady', filter: {type: 'hlasovani'}},
  '1122995611621392424': {db: 'teams', name: 'rakety', filter: {type: 'hlasovani'}}
}

module.exports = {
    name: 'edit',
    description: 'Updates specific hlasovani / form!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}, { id: ['Administrator'], type: 'PERMS', permission: true }],
    guild: ['1128307451066855515', '1122995611621392424', '1105413744902811688'],
    options: [
      {
        name: 'event',
        description: 'Jaký event chceš upravit?',
        type: 3,
        required: true,
        autocomplete: true
      },
      {
        name: 'mode',
        description: 'Co chceš upravit?',
        type: 3,
        required: false,
        choices: [
          { value: 'basic', name: 'základ' },
          { value: 'results', name: 'odpovědi' },
          { value: 'form', name: 'formulář' },
        ]
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {

      let _id = interaction.options.getString('event').split('_')
      let mode = interaction.options.getString('mode') || 'basic'


      /*
      let buttons = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`edit_cmd_edit_${_id[0]}_basic`).setStyle(2).setLabel('ZÁKLAD'))
        .addComponents(new ButtonBuilder().setCustomId(`edit_cmd_edit_${_id[0]}_results`).setStyle(2).setLabel('ODPOVĚDI'))
      if (_id[1] == 'form') buttons.addComponents(new ButtonBuilder().setCustomId(`edit_cmd_edit_${_id[0]}_form`).setStyle(2).setLabel('FORMULÁŘ'))

      interaction.editReply({ content: 'Co konkrétně chceš upravit?', components: [buttons] })
      */

      let data = await edge.get(dbs[interaction.guild.id].db, dbs[interaction.guild.id].name, {_id: _id[0]}).then(n => n[0])
      if (!data) return interaction.reply({ ephemeral: edge.isEphemeral(interaction), content: 'ERROR! Data nebyla nalezena! Kontaktuj prosím developera!'})

      const modal = new ModalBuilder().setCustomId('edit_cmd_results_' + data._id + '_' + mode).setTitle(`Edit ${data.name||data.question || data._id}! - ${mode}`.slice(0, 45))

      if (mode == 'basic') {
        modal.addComponents(textBox({ id: 'title', text: 'Název', example: 'Embed Title', value: data.name||data.question, required: true, max: 45}))
        modal.addComponents(textBox({ id: 'description', text: 'Popisek', example: 'Embed Description', value: data.description, required: true, style: 2}))
      
        if (data.type == 'hlasovani') modal.addComponents(textBox({ id: 'answers', text: 'Možnosti', example: 'Ano|Ne|Nevím', required: true, value: data.answers, style: 2}))
        if (interaction.guild.id == '1105413744902811688' && data.time) modal.addComponents(textBox({ id: 'time', text: 'Čas', example: '21. 11. 2023', value: new Date(data.time).toLocaleString('cs-CZ'), required: true}))
        //.addComponents(textBox({ id: '5', text: 'SOON', example: undefined, value: undefined, required: false}))
      
        return await interaction.showModal(modal)

      } else if (mode == 'results') {
        if (data.type == 'form') return interaction.reply({ ephemeral: true, content: 'Odpovědi formuláře se upravují v results příkazu!'})
        let answers = data.answers.split('|')
        for (let i = 0; i < answers.length; i++) {
          if (i > 4) break;
          let answer = data.answers.split('|')[i]
          if (!data[answer]) data[answer] = []
          modal.addComponents(textBox({ id: answer, text: answer, example: 'id, id, id', value: data[answer].join(', '), required: false, style: 2}))
        }
        return await interaction.showModal(modal)


      } else if (mode == 'form') {
        if (data.type !== 'form' || !data.questions) return interaction.reply({ ephemeral:true, content: `**${data.name || data.question}** nemá žádé form data na úpravu!`})

        for (let i = 0; i < 5; i++) {
          let question = data.questions[i]
          modal.addComponents(textBox({ id: String(i+1), text: `Otázka ${i+1}`, example: question || 'Nějaká otázka', value: question, required: false, max: 45}))
        }
        return await interaction.showModal(modal)


      } else interaction.reply({ content: 'Další módy momentálně nejsou naprogramovány!', ephemeral: true })

    },
    autocomplete: async (edge, interaction) => {

      let db = dbs[interaction.guild.id]
      if (!db) return interaction.respond([{ value: 'ne', name: 'Nenašel jsem ID serveru!'}])
      let show = await edge.get(db.db, db.name, db.filter).then(n => n.sort((a, b) => b.created - a.created).map(a => ({name: (a.name || a.question || a._id)?.slice(0, 100), value: a._id+'_'+a.type}) ))
    
      let focused = interaction.options.getFocused()?.toLowerCase()
      let z = show.filter(n => n.name.toLowerCase().includes(focused) || n.value.toLowerCase().includes(focused))
      return interaction.respond(z?.length ? z.slice(0,20) : [{ value: 'ne', name: 'Nenašel jsem žádný event!'}])

    },
    sendModal: async (edge, interaction) => {
      let _id = interaction.customId.split('_')[3]
      let mode = interaction.customId.split('_')[4]

      let data = await edge.get(dbs[interaction.guild.id].db, dbs[interaction.guild.id].name, {_id: _id}).then(n => n[0])
      if (!data) return interaction.reply({ ephemeral: edge.isEphemeral(interaction), content: 'ERROR! Data nebyla nalezena! Kontaktuj prosím developera!'})

      const modal = new ModalBuilder().setCustomId('edit_cmd_results_' + data._id + '_' + mode).setTitle(`Edit ${data.name||data.question || data._id}! - ${mode}`.slice(0, 45))

      if (mode == 'basic') {
        modal.addComponents(textBox({ id: 'title', text: 'Název', example: 'Embed Title', value: data.name||data.question, required: true, max: 45}))
        modal.addComponents(textBox({ id: 'description', text: 'Popisek', example: 'Embed Description', value: data.description, required: true, style: 2}))
      
        if (data.type == 'hlasovani') modal.addComponents(textBox({ id: 'answers', text: 'Možnosti', example: 'Ano|Ne|Nevím', required: true, value: data.answers, style: 2}))
        if (interaction.guild.id == '1105413744902811688' && data.time) modal.addComponents(textBox({ id: 'time', text: 'Čas', example: '21. 11. 2023', value: new Date(data.time).toLocaleString('cs-CZ'), required: true}))
        return await interaction.showModal(modal)

      } else if (mode == 'results') {
        if (data.type == 'form') return interaction.reply({ ephemeral: true, content: 'Odpovědi formuláře se upravují v results příkazu!'})
        let answers = data.answers.split('|')
        for (let i = 0; i < answers.length; i++) {
          if (i > 4) break;
          let answer = data.answers.split('|')[i]
          if (!data[answer]) data[answer] = []
          modal.addComponents(textBox({ id: answer, text: answer, example: 'id, id, id', value: data[answer].join(', '), required: false, style: 2}))
        }
        return await interaction.showModal(modal)


      } else if (mode == 'form') {
        if (data.type !== 'form' || !data.questions) return interaction.reply({ ephemeral:true, content: `**${data.name || data.question}** nemá žádé form data na úpravu!`})

        for (let i = 0; i < 5; i++) {
          let question = data.questions[i]
          modal.addComponents(textBox({ id: String(i+1), text: `Otázka ${i+1}`, example: question || 'Nějaká otázka', value: question, required: false, max: 45}))
        }
        return await interaction.showModal(modal)


      } else interaction.reply({ content: 'Další módy momentálně nejsou naprogramovány!', ephemeral: true })

    },
    results: async (edge, interaction) => {
      console.log(interaction)
      try { await interaction.update({ type:6 }) } catch (e) {interaction.reply({ content: 'Snad jen dočastna zprava... (vše by snad mělo fungovat)', ephemeral: true })}

      let _id = interaction.customId.split('_')[3]
      let mode = interaction.customId.split('_')[4]

      let data = await edge.get(dbs[interaction.guild.id].db, dbs[interaction.guild.id].name, {_id: _id}).then(n => n[0])
      if (!data) return interaction.followUp({ content: 'ERROR! Nenašel jsem data, konaktuj prosím developera!', ephemeral: true })

      let disabled = data.message ? false : true

      let res = interaction.fields.fields

      if (mode == 'basic') {
        if (data.name) data.name = res.get('title').value.trim()
        else if (data.question) data.question = res.get('title').value.trim()

        data.description = res.get('description').value.trim()
        if (data.type !== 'form' && res.get('answers')) data.answers = res.get('answers').value.trim()

        for (let answer of data.answers.split('|')) {
          if (!data[answer]) data[answer] = []
        }

        if (res.get('time')) {
          let min = res.get('time')?.value.replaceAll('. ', '-').split(' ')[1]?.trim() || '23:59'

          let time = res.get('time')?.value.replace(min, '').split('.').map(n => n.trim())
          let cas = [time[2], time[1].length == 1 ? `0${time[1]}` : time[1], time[0].length == 1 ? `0${time[0]}`: time[0] ]
          data.time = Date.parse(`${cas[0]}-${cas[1]}-${cas[2]} ${min}`)||data.time

        }

      } else if (mode == 'results') {
        let answers = res.map(n => ({ name: n.customId, value: n.value.split(',').map(a => a.trim()) }))

        for (let answer of answers) {
          data[answer.name] = answer.value.filter(n => n)
        }


      } else if (mode == 'form') {
        data.questions = interaction.fields.fields.map(n => n.value?.trim() ).filter(n => n.length)

      } else return interaction.followUp({ content: 'ERROR, neznámý mód, konaktuj prosím developera!', ephemeral: true })


      let channel = interaction.guild.channels.cache.get(data.channel)
      let embed = edge.commands.get(interaction.guild.id == '1105413744902811688' ? 'hlasovani' : 'team-anketa').getEmbed(data, {guild: interaction.guild})

      let components = []

      let c = 0;
      for (let i = 0; i < data.answers.split('|').length; i++) {
        if (!components[c]) components.push(new ActionRowBuilder())

        let answer = data.answers.split('|')[i]

        let styl = 2
        if (data.type == 'form' && answer == 'Accept') styl = 3
        else if (data.type == 'form' && answer == 'Deny') styl = 4

        let prefix = interaction.guild.id == '1105413744902811688' ? (data.type || 'hlasovani') : 'team-anketa'
        let sufix = interaction.guild.id == '1105413744902811688' ? '' : `_${dbs[interaction.guild.id].name}`

        let label = data.type == 'form' ? answer.replace('Accept', 'PŘIHLAŠUJI').replace('Deny', 'ODMÍTÁM') : answer

        components[c].addComponents(new ButtonBuilder().setCustomId(`${prefix}_cmd_select${sufix}_${data._id}_${answer}`).setStyle(styl).setLabel(label).setDisabled(disabled))

        if (i !== 0 && i % 5 == 0) c++
      }
      if (data.type == 'form') components[0].addComponents(new ButtonBuilder().setCustomId(`form_cmd_editHandler_${data._id}`).setStyle(2).setLabel('EDIT').setDisabled(disabled))

      await edge.post(dbs[interaction.guild.id].db, dbs[interaction.guild.id].name, data)

      if (data.message) {
        let msg = await channel.messages.fetch(data.message)
        if (msg) msg.edit({ embeds: [embed], components: components})

        interaction.followUp({ ephemeral: true, content: 'Changed!'})
      } else if (interaction.message.components.length) {
        components.push(interaction.message.components[interaction.message.components.length-1])
        interaction.followUp({ embeds: [embed], components: components, ephemeral: true})
      }
    }
}