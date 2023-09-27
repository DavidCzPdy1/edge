
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, StringSelectMenuBuilder } = require('discord.js')

module.exports = {
  name: 'team-toggle',
  description: 'Vypnutí a zapnutí tlačítek!',
  permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: ['Administrator'], type: 'PERMS', permission: true }],
  guild: ['1128307451066855515', '1122995611621392424'],
  options: [
    {
      name: 'message',
      description: 'V jaké zprávě chceš změnit tlačítka?',
      type: 3,
      required: true,
      autocomplete: true
    }
  ],
  type: 'slash',
  platform: 'discord',
  run: async (edge, interaction) => {
    await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

    let msgId = interaction.options.getString('message')

    let message = await interaction.channel.messages.fetch(msgId)
    if (!message) return interaction.editReply({ content: `Nenašel jsem zprávu v kanálu <#${interaction.channel.id}> s ID ${msgId}!` })

    let components = message.components[0]
    components.components.forEach(n => n.data.disabled = !n.data.disabled)
    await message.edit({ components: [components] })

    interaction.editReply({ content: `Změnil jsem tlačítka!` })
  },
  autocomplete: async (edge, interaction) => {

    let show = await interaction.channel.messages.fetch()
    show = show.map(n => n).filter(n => n.components?.length)
    
    show = show.map(n => ({name: n?.embeds[0]?.title.slice(0, 100) || n.id, value: n.id}))
    let focused = interaction.options.getFocused()?.toLowerCase()
    let z = show.filter(n => n.name.toLowerCase().includes(focused) || n.value.includes(focused))
    return interaction.respond(z?.length ? z.slice(0,20) : [{ value: 'ne', name: 'Nenašel jsem žádnou zprávy!'}])
  
  }
}