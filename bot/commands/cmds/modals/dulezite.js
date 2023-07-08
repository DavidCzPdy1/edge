
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
        type: 8,
        required: false
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {

      let data = {
        _id: String(new Date().getTime()),
        channel: interaction.options.getChannel('channel')?.id || '1105918656203980870',
        ack: interaction.options.getString('ack') || 'team',
        ping: interaction.options.getRole('ping')?.id || undefined,
        mention: false
      }

      const modal = new ModalBuilder().setCustomId('dulezite_cmd_create_'+data._id).setTitle(`Výroba nového postu!`)
        .addComponents(textBox({ id: 'title', text: 'Název', example: undefined, value: undefined, required: true}))
        .addComponents(textBox({ id: 'description', text: 'Popisek', example: undefined, value: undefined, required: true, style: 2}))
        .addComponents(textBox({ id: 'fields', text: 'Fields', example: undefined, value: undefined, required: false, style: 2}))
        //.addComponents(textBox({ id: '4', text: 'SOON', example: undefined, required: false, value: undefined}))
        //.addComponents(textBox({ id: '5', text: 'SOON', example: undefined, value: undefined, required: false}))
      
      await interaction.showModal(modal);
      await edge.post('general', 'messages', data)
    },
    create: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })
      let id = interaction.customId.split('_')[3]


      let data = await edge.get('general', 'messages', {_id: id})
      if (!data.length) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem danou zpravu!', description: `Kontaktuj prosím developera!`, color: 15548997 }], ephemeral: true })
      data = data[0]


      let errorEmbed = { title: `ERROR! Použij příkaz znovu: </${interaction.commandName}:${interaction.commandId}>`, description: `Kanál nebyl nalezen!`, color: 15548997, footer: { icon_url: interaction?.guild?.iconURL() || '', text: 'EDGE Discord'} }

      if (!data.channel) return interaction.reply({ embeds: [errorEmbed], ephemeral: true})

      data.info = interaction.fields.fields.map(n => { return {type: n.customId, value: n.value?.trim() }}).filter(n => n.value.length)

      let embed = { title: data.info.find(n => n.type == 'title')?.value, description: data.info.find(n => n.type == 'description')?.value, fields: data.info.find(n => n.type == 'fields')?.value?.split('||').map(n => {return {name: n.split('|')[0], value: n.split('|')[1], inline: n.split('|')[2]||false}}),  color: 5832623 }
      
      //data.channel?.send()
      let ack = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`dulezite_cmd_ack_${data._id}`).setStyle(2).setLabel('PŘEČTENO').setDisabled(true));
      let accept = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`dulezite_cmd_accept_${data._id}`).setStyle(3).setLabel('POSLAT').setDisabled(true))
        .addComponents(new ButtonBuilder().setCustomId(`dulezite_cmd_deny_${data._id}`).setStyle(4).setLabel('NEPOSLAT').setDisabled(true))

      let msg = { content: `[<@&${data.ping}>]`, embeds: [embed], allowedMentions: { parse: data.mention ? ['roles', 'users'] : [ack, accept]} }
      console.log(embed)
      await interaction.editReply(msg)

      await edge.post('general', 'events', data)
    },
}