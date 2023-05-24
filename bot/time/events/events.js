
const eventName = module.filename.includes('/') ? module.filename.split('/').filter(n => n.endsWith('.js'))[0].split('.')[0] : module.filename.split('\\').filter(n => n.endsWith('.js'))[0].split('.')[0]


module.exports = {
  name: eventName,
  description: "Time events that manages time in /hlasovani & events",
  emoji: '📜',
  time: '0 */5 * * * *', //'*/10 * * * * *'
  ignore: '* * * * * *', //'sec min hour den(mesic) mesic den(tyden)'
  onstart: false,
  run: async (edge, options) => {
    let database = await edge.get('general', 'events', {}).then(n => n.filter(a => !a.finished))
    for (let data of database) {
      if (!data.time || data.time > new Date().getTime()) continue;

      let channel = await dc_client.channels.cache.get(data.channel)
      if (!channel) { console.error('Time management nenašel channel eventu ' + data._id); continue}
      let message = await channel?.messages.fetch(data.message || 0)
      if (!message) { console.error('Time management nenašel zprávu eventu ' + data._id); continue}

      let components = message.components[0]
      components.components.forEach(n => n.data.disabled = true)
      await message.edit({ components: [components]})
      console.discord('Ended time-effected event - ' + data._id)
      data.finished = new Date().getTime()
      await edge.post('general', 'events', data)
    }

    
  }
}