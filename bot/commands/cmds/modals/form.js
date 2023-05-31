
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }
const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

module.exports = {
    name: 'form',
    description: 'Creates new form!',
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

      return interaction.reply({ content: 'Coming SOON', ephemeral: true})
      let data = {
        _id: interaction.options.getString('question').replaceAll('_', ' '),
        description: interaction.options.getString('description'),
        time: interaction.options.getString('time') || null,
        mode: interaction.options.getString('mode') || 'team',
        type: 'form',
        channel: '1105918656203980870',
        perms: 'trener',
        pings: Number(interaction.options.getString('pings')) || 0,
        created: new Date().getTime(),
        format: 'text' || 'mention',
        Reply: [],
        Deny: []
      }

      let events = await edge.get('general', 'events', {_id: data._id})
      let errorEmbed = { title: `ERROR! Použij příkaz znovu: </${interaction.commandName}:${interaction.commandId}>`, description: `Hlasování nebo form s tímto názvem už existuje!`, fields: Object.keys(data).filter(n => data[n]).map(n => {return{ name: n, value: `\`${data[n]}\``, inline: true}}), color: 15548997, footer: { icon_url: interaction?.guild?.iconURL() || '', text: 'EDGE Discord'} }
      if (events.length) return interaction.editReply({ embeds: [errorEmbed]})
      

      if (data.time) {
        let time = data.time.split('.').map(n => n.trim())
        let cas = [time[2], time[1].length == 1 ? `0${time[1]}` : time[1], time[0].length == 1 ? `0${time[0]}`: time[0] ]
        data.time = Date.parse(`${cas[0]}-${cas[1]}-${cas[2]} 23:59`)

        if (data.time < new Date().getTime()) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Zadaný čas už byl!`)]})
        else if (data.time - 1000*60*60*20 < new Date().getTime()) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Zadaný čas je dřív než za 20 hodin!`)]})
      } else data.finished = -1;

      // Předělat na otazky ve formu
      const modal = new ModalBuilder().setCustomId('form_cmd_create').setTitle(`${data._id}`)
        .addComponents(textBox({ id: 'name', text: 'Jaký má být název?', example: 'Přihláška na indoor turnaj 18. 3. 2023', value: undefined, required: true}))
        .addComponents(textBox({ id: 'description', text: 'Jaký chceš mít popisek?', example: 'Turnaj v Praze', value: undefined, style: 2, required: true}))
        .addComponents(textBox({ id: 'time', text: 'Do kdy se má reagovat?', example: '10. 6. 2023', value: undefined, required: true}))
        .addComponents(textBox({ id: 'pings', text: 'Upomínání na nehlasování (hours)', example: '72', required: false, value: '0'}))
        .addComponents(textBox({ id: 'mode', text: 'Hlasovat za uživatele / tým', example: 'user | tym', value: 'tym', required: false}))
      
      await interaction.showModal(modal);
      await edge.post('general', 'events', data)
    },
    create: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })
      let question = interaction.customId.split('_')[3]

      let data = await edge.get('general', 'events', {_id: question})
      if (!data.length) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem daný event!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]


      let embed = edge.commands.get('hlasovani').getEmbed(data)
      //if (embed.fields.length > 5) return interaction.editReply({ embeds: [updateDesc(errorEmbed, `Je zadáno moc odpovědí! (${embed.fields.length})`)]})

      let odpovedi = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`forum_cmd_select_${data._id}_Reply`).setStyle(3).setLabel('Reply').setDisabled(true))
        .addComponents(new ButtonBuilder().setCustomId(`forum_cmd_select_${data._id}_Deny`).setStyle(4).setLabel('Reply').setDisabled(true))


      let accept = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_deny_${data.question}`).setStyle(4).setLabel('NEPOSLAT'))
        .addComponents(new ButtonBuilder().setCustomId(`hlasovani_cmd_accept_${data.question}`).setStyle(3).setLabel('POSLAT'))

    }
}