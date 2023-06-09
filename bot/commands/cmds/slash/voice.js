const axios = require('axios')

module.exports = {
    name: 'voice',
    description: 'Voice test command!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })
      
      let content = 'null'

      let row = await axios.get(`https://m.radio7.cz/vysilame_row.php`).then(n => n.data)
      content = row
     // if (row) {
/*
        let porad = row.match(/(<strong>)(.*?)(<\/strong>: )/)
        if (porad.length) porad = porad[2]?.trim()
        let text = row.replace(/(<strong>)(.*?)(<\/strong>: )/i, '')?.trim()

        content = porad + ': ' + text
*/
/*
      let text = row.replace('<strong>', '').replace('</strong>', '').trim()
      let reg = / [A-Z][a-ž]*: /g
      let info = text.match(reg) ? text.match(reg).map((n, i) => n + text.split(reg)[i]) : [text]
      console.log(text)
      console.log(info)

      content = info.join('\n')
      }
      */

      

      let voice = edge.discord.voice
      voice.play()
      interaction.editReply({ content: content })
    }
}