
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'table',
    description: 'Table test command!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })
        
      let google = edge.google
      
      let data = await google.sheets.spreadsheets.values.append({
        auth: google.auth,
        spreadsheetId: google.tableId,
        range: 'List 1!A1:B1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [
            ['Ahoj', 'TADY DAVID'],
            ['NAzdar', 'JAK SE MAS']
          ]
        }
      }).then(n => n.data)
      //console.log(data)
      interaction.editReply({ content: 'Testing' })
    }
}