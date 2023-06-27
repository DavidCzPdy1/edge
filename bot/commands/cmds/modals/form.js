
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }
const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

module.exports = {
    name: 'form',
    description: 'Creates new form!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [
      {
        name: 'title',
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
        name: 'time',
        description: 'Do kdy se musí reagovat?',
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

      let data = {
        _id: interaction.options.getString('title').replaceAll('_', ' '),
        description: interaction.options.getString('description'),
        time: interaction.options.getString('time') || null,
        mode: interaction.options.getString('mode') || 'team',
        type: 'form',
        channel: '1105918656203980870',
        perms: 'trener',
        pings: Number(interaction.options.getString('pings')) || 0,
        created: new Date().getTime(),
        format: 'text' || 'mention',
        answers: 'Accept|Deny',
        numberAnswers: 2,
        Accept: [],
        Deny: []
      }

      let events = await edge.get('general', 'events', {}).then(n => n.filter(a => a._id.toLowerCase() == data._id.toLowerCase()))
      let errorEmbed = { title: `ERROR! Použij příkaz znovu: </${interaction.commandName}:${interaction.commandId}>`, description: `Hlasování nebo form s tímto názvem už existuje!`, fields: Object.keys(data).filter(n => data[n]).map(n => {return{ name: n, value: `\`${data[n]}\``, inline: true}}), color: 15548997, footer: { icon_url: interaction?.guild?.iconURL() || '', text: 'EDGE Discord'} }
      if (events.length) return interaction.reply({ embeds: [errorEmbed], ephemeral: true})
      

      if (data.time) {
        let time = data.time.split('.').map(n => n.trim())
        let cas = [time[2], time[1].length == 1 ? `0${time[1]}` : time[1], time[0].length == 1 ? `0${time[0]}`: time[0] ]
        data.time = Date.parse(`${cas[0]}-${cas[1]}-${cas[2]} 23:59`)

        if (data.time < new Date().getTime()) return interaction.reply({ embeds: [updateDesc(errorEmbed, `Zadaný čas už byl!`)], ephemeral: true})
        else if (data.time - 1000*60*60*20 < new Date().getTime()) return interaction.reply({ embeds: [updateDesc(errorEmbed, `Zadaný čas je dřív než za 20 hodin!`)]})
      } else data.finished = -1;

      const modal = new ModalBuilder().setCustomId('form_cmd_create_'+data._id).setTitle(`${data._id}`)
        .addComponents(textBox({ id: '1', text: 'Otázka 1', example: 'Email', value: undefined, required: true}))
        .addComponents(textBox({ id: '2', text: 'Otázka 2', example: 'Telefon', value: undefined, required: false}))
        .addComponents(textBox({ id: '3', text: 'Otázka 3', example: 'Poznámka', value: undefined, required: false}))
        .addComponents(textBox({ id: '4', text: 'Otázka 4', example: undefined, required: false, value: undefined}))
        .addComponents(textBox({ id: '5', text: 'Otázka 5', example: undefined, value: undefined, required: false}))
      
      await interaction.showModal(modal);
      await edge.post('general', 'events', data)
    },
    create: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })
      let title = interaction.customId.split('_')[3]

      let data = await edge.get('general', 'events', {_id: title})
      if (!data.length) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      data.questions = interaction.fields.fields.map(n => n.value?.trim() ).filter(n => n.length)
      

      let embed = edge.commands.get('hlasovani').getEmbed(data)
      

      let odpovedi = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`forum_cmd_select_${data._id}_Accept`).setStyle(3).setLabel('Accept').setDisabled(true))
        .addComponents(new ButtonBuilder().setCustomId(`forum_cmd_select_${data._id}_Deny`).setStyle(4).setLabel('Deny').setDisabled(true))


      let accept = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_accept_${data._id}`).setStyle(3).setLabel('POSLAT'))
        .addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_deny_${data._id}`).setStyle(4).setLabel('NEPOSLAT'))
        .addComponents(new ButtonBuilder().setCustomId(`form_cmd_select_${data._id}_Preview`).setStyle(2).setLabel('Preview'))

        interaction.followUp({ embeds: [embed], components: [odpovedi, accept]})

        await edge.post('general', 'events', data)
    },
    select: async (edge, interaction) => {
      let title = interaction.customId.split('_')[3]
      let answer = interaction.customId.split('_')[4]
      let options = interaction.customId.split('_')[5]

      let data = await edge.get('general', 'events', {_id: title})
      if (!data.length) return interaction.reply({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      if (interaction.guild?.id !== '1105413744902811688') return interaction.reply({ embeds: [{ title: 'Nenašel jsem edge discord server!', description: `Wierd error :D`, color: 15548997 }], ephemeral: true })

      let access = interaction.member._roles.includes(edge.config.discord.roles[`position_${data.perms || 'trener'}`])
      if (!access) return interaction.reply({ embeds: [{ title: 'Nemáš potřebné oprávnění na reakci!', description: `Potřebuješ <@&${edge.config.discord.roles[`position_${data.perms}`]}>`, color: 15548997 }], ephemeral: true })

      let id = data.mode == 'team' ? interaction.member._roles.find(n => Object.keys(edge.config.discord.roles).filter(a => a.startsWith('club_')).map(a => edge.config.discord.roles[a]).includes(n)) : interaction.user.id
      if (!id) return interaction.reply({ embeds: [{ title: 'Nemáš žádnou týmovou roli!', description: `Pokud nějakou chceš, použij /verify!`, color: 15548997 }], ephemeral: true })
      
      let ids = data.answers.split('|').map(n => {return { ids: data[n]?.map(a => a.id || a), name: n}})
      let answered = ids.find(n => n.ids.includes(id));

      if (answer == 'Deny') {
        if (answered && answered.name !== 'Deny') return interaction.reply({ embeds: [{ title: 'Už mám zaznemenanou reakci!', description: 'Nemůžeš odstranit', color: 15548997 }], ephemeral: true })
        else if (answered) {
          data[answer] = data[answer].filter(n => n !== id)
          let embed = { title: 'Odstranení hlasu!', description: `Reakce: \`${answer}\`\nReacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }
          interaction.reply({ embeds: [embed], ephemeral: true })
          console.discord(`Odstranění reakce v \`${title}\`\n${embed.description}`)
        } else {
          data[answer].push(id)
          let embed = { title: 'Přidání hlasu!', description: `Reakce: \`${answer}\`\nReacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }
          interaction.reply({ embeds: [embed], ephemeral: true })
          console.discord(`Přidání hlasu v \`${title}\`\n${embed.description}`)
        }
      } else {
        if (answered && answered.name == 'Deny') data.Deny = data.Deny.filter(n => n !== id)

        let answerCount =  data.Accept.filter(n => n.id == id).length

        if (answerCount >= data.numberAnswers) return interaction.reply({ embeds: [{ title: 'Reakce už je zaznamenána!', description: `Reacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }], ephemeral: true })

        const modal = new ModalBuilder().setCustomId('form_cmd_react_'+data._id+'_'+id).setTitle(`${data._id}`)
        for (let i = 0; i < data.questions.length; i++) {
          let question = data.questions[i]
          modal.addComponents(textBox({ id: String(i), text: question, example: undefined, value: undefined, required: i == data.questions.length - 1 ? false : true}))
        }
        await interaction.showModal(modal)

      }
      await edge.post('general', 'events', data)

      let embed = edge.commands.get('hlasovani').getEmbed(data, { guild: interaction.guild })
      await interaction.message.edit({ embeds: [embed]})

      
    },
    preview: async (edge, interaction) => {
      await interaction.update({ type:6 })
      interaction.followUp({ephemeral: true, content: 'Dotazník byl pouze v preview režimu! Odpověď něbyla uložena.'})
    },
    react: async (edge, interaction) => {
      await interaction.update({ type:6 })

      let title = interaction.customId.split('_')[3]
      let id = interaction.customId.split('_')[4]

      if (interaction.guild?.id !== '1105413744902811688') return interaction.followUp({ embeds: [{ title: 'Nenašel jsem edge discord server!', description: `Wierd error :D`, color: 15548997 }], ephemeral: true })

      let data = await edge.get('general', 'events', {_id: title})
      if (!data.length) return interaction.followUp({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      if (data.Accept.filter(n => n.id == id).length >= data.numberAnswers) return interaction.followUp({ embeds: [{ title: 'Reakce už je zaznamenána!', description: `Nemůžeš reagovat vícekrát, než ${data.numberAnswers}x!\nReacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }], ephemeral: true })

      let answers = interaction.fields.fields.map(n => {return {name: n.customId, value: n.value?.trim()}}).filter(n => n.value.length)
      let odpovedi = {}
      for (const odpoved of answers) {
        odpovedi[data.questions[odpoved.name]] = odpoved.value
      }

      let push = {
        id : id,
        answers: odpovedi,
        by: interaction.user.id,
        time: new Date().getTime()
      }
      data.Accept.push(push)

      let em = { title: 'Reakce zaznamenána!', description: `Reacted as ${(data.mode == 'team' ? ('<@&'+ id + `> (by ${interaction.user})`) : ('<@'+ id + '>'))}`, color: 15548997 }
      interaction.followUp({ embeds: [em], ephemeral: true })
      console.discord(`Nová reakce v \`${title}\`\n${em.description}`)

      await edge.post('general', 'events', data)

      let embed = edge.commands.get('hlasovani').getEmbed(data, { guild: interaction.guild })
      await interaction.message.edit({ embeds: [embed]})

      await edge.google.nahratData(data, {guild: interaction.guild})

    }
}