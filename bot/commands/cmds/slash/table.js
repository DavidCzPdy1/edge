
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

    let event = events[0]


    let answers = event.answers.split('|').map((n, i) => {
      let name = event[n].map(a => event.mode == 'team' ? guild.roles.cache.get(a).name : (guild.members.cache.get(a).nickname || guild.members.cache.get(a).user.username))
      return { name: name, s: i }
    })

    let l = 0
    for (a of answers) { if (l < a.name.length) l = a.name.length }


    let format = []
    for (let i = 0; i < l; i++) {
      let push = []
    
      for (let a = 0; a < answers.length; a++) {
        push[a] = answers[a].name[i] || ''
      }
      format.push(push)
    }

    let nahrat = [
      event.answers.split('|'),
      ...format
    ]
    console.log(nahrat)




    let data = await google.sheets.spreadsheets.values.append({
      auth: google.auth,
      spreadsheetId: google.tableId,
      range: 'List 1!A1:B1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: nahrat
      }
    }).then(n => n.data)
    //console.log(data)
    interaction.editReply({ content: 'Testing' })
  }
}