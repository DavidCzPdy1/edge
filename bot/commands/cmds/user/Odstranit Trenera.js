
const { ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder } = require('discord.js')

module.exports = {
    name: 'Odstranit Trenera',
    description: 'Remove EDGE trainers!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    guild: ['1105413744902811688'],
    type: 'user',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let ikona = interaction.guild.iconURL()

      let trainer = await edge.get('general', 'clubs', {_id: 'list'}).then(n => n[0])

      let id = interaction.targetId

      if (!trainer.list.includes(id)) return interaction.editReply({ embeds: [{ title: 'ERROR v REMOVE cmd', description: `<@${id}> není na listině trenérů!`, color: 15548997, footer: { text: 'EDGE /trener cmd', icon_url: ikona } }]})
      trainer.list = trainer.list.filter(n => n !== id)

      await edge.post('general', 'clubs', trainer)

      await interaction.editReply({ embeds: [{ title: 'SUCCESS', description: `<@${id}> byl odebrán z listiny trenérů!`, color: 2067276, footer: { text: 'EDGE /trener cmd', icon_url: ikona } }]})
      return edge.discord.roles.updateRoles()
    }
}