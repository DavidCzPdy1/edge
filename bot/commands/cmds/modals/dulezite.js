
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
        mention: false,
        type: 'msg',
        read: [],
      }

      const modal = new ModalBuilder().setCustomId('dulezite_ignore_create_'+data._id).setTitle(`Výroba nového postu!`)
        .addComponents(textBox({ id: 'title', text: 'Název', example: undefined, value: undefined, required: true}))
        .addComponents(textBox({ id: 'description', text: 'Popisek', example: undefined, value: undefined, required: true, style: 2}))
        .addComponents(textBox({ id: 'fields', text: 'Fields', example: undefined, value: undefined, required: false, style: 2}))
        //.addComponents(textBox({ id: '4', text: 'SOON', example: undefined, required: false, value: undefined}))
        //.addComponents(textBox({ id: '5', text: 'SOON', example: undefined, value: undefined, required: false}))
      
      await interaction.showModal(modal);
      interaction = await interaction.awaitModalSubmit({filter: (n) => n.customId == 'dulezite_ignore_create_'+data._id, time: 180000}).catch(e => {})
      if (!interaction) return

      await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction)})

      data.info = interaction.fields.fields.map(n => { return {type: n.customId, value: n.value?.trim() }}).filter(n => n.value.length)

      let embed = { title: data.info.find(n => n.type == 'title')?.value, description: data.info.find(n => n.type == 'description')?.value, fields: data.info.find(n => n.type == 'fields')?.value?.split('||').map(n => {return {name: n.split('|')[0], value: n.split('|')[1], inline: n.split('|')[2]||false}}),  color: 5832623 }
      
      let ack = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`dulezite_cmd_ack_${data._id}`).setStyle(2).setLabel('PŘEČTENO').setDisabled(true));
      let accept = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`dulezite_cmd_accept_${data._id}`).setStyle(3).setLabel('POSLAT').setDisabled(false))
        .addComponents(new ButtonBuilder().setCustomId(`dulezite_cmd_deny_${data._id}`).setStyle(4).setLabel('NEPOSLAT').setDisabled(false))

      let msg = { content: data.ping ? `[<@&${data.ping}>]` : undefined, embeds: [embed], allowedMentions: { parse: data.mention ? ['roles', 'users'] : []}, components: [data.ack != 'none' ? ack : undefined, accept].filter(n =>n) }
      await interaction.editReply(msg)

      await edge.post('general', 'messages', data)
    },
    accept: async (edge, interaction) => {
      await interaction.update({ type: 6 })
      let id = interaction.customId.split('_')[3]
      
      let data = await edge.get('general', 'messages', { _id: id }).then(n => n[0])
      if (!data) return interaction.editReply({ embeds: [], content: 'Zpráva nebyla nalezena v databázi!'})

      let channel = dc_client.channels.cache.get(data.channel)
      if (!channel) return interaction.editReply({ embeds: [], content: `Nebyl nalezen kanál s id ${data.channel}!`, components: [] })

      let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
      if (!access) return interaction.followUp({ embeds: [], content: `Nemám oprávnění posílat embed zprávy do ${channel}!`, components: [], ephemeral: edge.isEphemeral(interaction) })

      let embed = { title: data.info.find(n => n.type == 'title')?.value, description: data.info.find(n => n.type == 'description')?.value, fields: data.info.find(n => n.type == 'fields')?.value?.split('||').map(n => {return {name: n.split('|')[0], value: n.split('|')[1], inline: n.split('|')[2]||false}}),  color: 5832623 }
      let ack = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`dulezite_cmd_ack_${data._id}_${data.ack}`).setStyle(2).setLabel('PŘEČTENO').setDisabled(false));

      let msg = { content: data.ping ? `[<@&${data.ping}>]` : undefined, embeds: [embed], allowedMentions: { parse: data.mention ? ['roles', 'users'] : []}, components: [data.ack != 'none' ? ack : undefined].filter(n =>n) }
      let message = await channel.send(msg)

      data.msgUrl = message.url
      await edge.post('general', 'messages', data)

      interaction.editReply({content: 'Zpráva byla úspěšně poslána!', embeds: [], components: [] })
    },
    deny: async (edge, interaction) => {
      await interaction.update({ type: 6 })
      let id = interaction.customId.split('_')[3]
      
      await edge.delete('general', 'messages', { _id: id })
      interaction.editReply({content: 'Zpráva byla odstraněna z databáze', embeds: [], components: [] })
    },
    ack: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let id = interaction.customId.split('_')[3]
      let type = interaction.customId.split('_')[4]
      
      let data = await edge.get('general', 'messages', { _id: id }).then(n => n[0])
      if (!data) return interaction.editReply({ components: []})

      if (!data.read) data.read = []
      if (data.read.includes(interaction.user.id)) return interaction.followUp({ ephemeral: true, content: 'Reakce již byla zaznamenána!'})
      data.read.push(interaction.user.id)

      await edge.post('general', 'messages', data)

      interaction.followUp({ephemeral: true, content: 'Zpráva označena jako přečtená!'})

    }
}