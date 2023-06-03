
const axios = require('axios')

const eventName = module.filename.includes('/') ? module.filename.split('/').filter(n => n.endsWith('.js'))[0].split('.')[0] : module.filename.split('\\').filter(n => n.endsWith('.js'))[0].split('.')[0]

module.exports = {
  name: eventName,
  description: "Voice time event",
  emoji: '📜',
  time: '0 * * * * *', //'*/10 * * * * *'
  ignore: '* * * * * *', //'sec min hour den(mesic) mesic den(tyden)'
  onstart: false,
  run: async (edge, options) => {
    
    let content = 'Edge discord'
/*
    let row = await axios.get(`https://m.radio7.cz/vysilame_row.php`).then(n => n.data)
    if (row) {
      let porad = row.match(/(<strong>)(.*?)(<\/strong>: )/)
      if (porad?.length) porad = porad[2]?.trim()
      let text = row.replace(/(<strong>)(.*?)(<\/strong>: )/i, '')?.trim()

      content = porad + ': ' + text
    }
    */

    let voice = edge.discord.voice
    voice.play()
    
  }
}