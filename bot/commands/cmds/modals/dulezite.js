
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }
const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

module.exports = {
    name: 'dulezite',
    description: 'Sends important message to channel you chose!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [
      {
        name: 'ack',
        description: 'Jaké chceš potvrzení o přečtení?',
        type: 3,
        required: false,
        choices: [
          { value: 'none', name: 'Žádné' },
          { value: 'team', name: 'Za tým' },
          { value: 'user', name: 'Za uživatele' },
        ]
      },
      {
        name: 'channel',
        description: 'Kam mám zprávu poslat??',
        type: 7,
        required: false
      },
      {
        name: 'ping',
        description: 'Koho mám označit?',
        type: 9,
        required: false
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {

      let data = {
        _id: String(new Date().getTime()),
        channel: interaction.options.getChannel('role') || dc_client.channels.cache.get('1105918656203980870'),
        ack: interaction.options.getString('ack') || 'team',
        ping: interaction.getMentionable(ping) || undefined,
        mention: false
      }

      let errorEmbed = { title: `ERROR! Použij příkaz znovu: </${interaction.commandName}:${interaction.commandId}>`, description: `Kanál nebyl nalezen!`, color: 15548997, footer: { icon_url: interaction?.guild?.iconURL() || '', text: 'EDGE Discord'} }
      if (!data.channel) return interaction.reply({ embeds: [errorEmbed], ephemeral: true})
  
      channel?.send({ content: ping, embeds: [{ title: 'Důležitá zpráva', description: data.msg, color: 2067276 }], allowedMentions: { parse: data.mention ? ['roles', 'users'] : [] } })

      const modal = new ModalBuilder().setCustomId('dulezite_cmd_create_'+data._id).setTitle(`${data._id}`)
        .addComponents(textBox({ id: '1', text: 'Název', example: undefined, value: undefined, required: true}))
        .addComponents(textBox({ id: '2', text: 'Popisek', example: undefined, value: undefined, required: true}))
        .addComponents(textBox({ id: '3', text: 'Fields', example: undefined, value: undefined, required: false}))
        .addComponents(textBox({ id: '4', text: 'SOON', example: undefined, required: false, value: undefined}))
        .addComponents(textBox({ id: '5', text: 'SOON', example: undefined, value: undefined, required: false}))
      
      await interaction.showModal(modal);
      await edge.post('general', 'messages', data)
    },
    create: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })
      let id = interaction.customId.split('_')[3]

      let data = await edge.get('general', 'messages', {_id: id})
      if (!data.length) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem danou zpravu!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]

      data.info = interaction.fields.fields.map(n => n.value?.trim() ).filter(n => n.length)
      console.log(data.info)

      let accept = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`dulezite_cmd_accept_${data._id}`).setStyle(3).setLabel('POSLAT'))
        .addComponents(new ButtonBuilder().setCustomId(`dulezite_cmd_deny_${data._id}`).setStyle(4).setLabel('NEPOSLAT'))

      interaction.editReply({ content: 'soon', embeds: [], components: []})

      await edge.post('general', 'events', data)
    },
}