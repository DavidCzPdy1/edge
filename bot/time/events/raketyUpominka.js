
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, MentionableSelectMenuBuilder } = require('discord.js')
const eventName = module.filename.includes('/') ? module.filename.split('/').filter(n => n.endsWith('.js'))[0].split('.')[0] : module.filename.split('\\').filter(n => n.endsWith('.js'))[0].split('.')[0]


module.exports = {
  name: eventName,
  description: "Remindes raketky on trainings",
  emoji: '🦖',
  time: '0 0 18 * * 0', //'*/10 * * * * *'
  ignore: '* * * * * *', //'sec min hour den(mesic) mesic den(tyden)'
  onstart: false,
  run: async (edge, options) => {
  
    let channel = await dc_client.channels.cache.get('1145714511165272165')
    channel.send({ content: '@everyone nezapomeňte hlasovat na zítřejší trénink!', allowedMentions: { parse: ['everyone'] }})

  }
}