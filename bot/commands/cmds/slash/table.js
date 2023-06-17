
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'table',
  description: 'Table test command!',
  permissions: [{ id: '378928808989949964', type: 'USER', permission: true }, { id: '1105555145456107581', type: 'ROLE', permission: true }],
  options: [],
  type: 'slash',
  platform: 'discord',
  run: async (edge, interaction) => {
    await interaction.deferReply({ ephemeral: true })

    let google = edge.google

    let guild = dc_client.guilds.cache.get('1105413744902811688')
    if (!guild) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem EDGE Discord server!', color: 15548997 }] })

    let events = await edge.get('general', 'events', {})//.then(n => n[0])

    //let event = events[0]

    for (let event of events) {
      await google.nahratData(event, {guild: guild})
    }

    interaction.editReply({ content: 'Testing' })
  }
}