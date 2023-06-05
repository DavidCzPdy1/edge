
const eventName = module.filename.includes('/') ? module.filename.split('/').filter(n => n.endsWith('.js'))[0].split('.')[0] : module.filename.split('\\').filter(n => n.endsWith('.js'))[0].split('.')[0]


module.exports = {
  name: eventName,
  description: "Time events that manages time in /hlasovani & events",
  emoji: '📜',
  time: '0 */5 * * * *', //'*/10 * * * * *'
  ignore: '* * * * * *', //'sec min hour den(mesic) mesic den(tyden)'
  onstart: false,
  run: async (edge, options) => {
    let database = await edge.get('general', 'events', {})//.then(n => n.filter(a => !a.finished))
    
    for (let data of database) {
      let guild = dc_client.guilds.cache.get('1105413744902811688')
      if (!guild) {console.time('TIME event - EVENTS - Nenašel jsem guildu');continue;}

      if (data.message) {
        let message = await dc_client.channels.cache.get(data.channel)?.messages.fetch(data.message).catch(e => {})
        if (message) { 
          let embed = edge.commands.get('hlasovani').getEmbed(data, {guild: guild})
          await message.edit({ embeds: [embed]})
        }
      }
      if (!data.time) continue;
      else if (data.time > new Date().getTime()) {
        if (!data.pings || data.mode !== 'team') continue;
        let lastPing = data.lastPing || data.created
        if (lastPing + data.pings * 60 * 60 * 1000 > new Date().getTime()) continue;

        let answered = []
        data.answers.split('|').forEach(n => {data[n].forEach(a => answered.push(a))})

        let guild = dc_client.guilds.cache.get('1105413744902811688')
        if (!guild) {console.time('TIME event - EVENTS - Nenašel jsem guildu');continue;}

        let channel = await dc_client.channels.cache.get(data.channel)
        if (!channel) { console.error('Time management (0) nenašel channel eventu ' + data._id); continue}
        let message = data.message ? await channel?.messages.fetch(data.message).catch(e => {}) : null
        if (!message) { console.error('Time management (0) nenašel zprávu eventu ' + data._id); continue}
        if (message.components[0].components[0].data.disabled) { console.error(data._id + ' je PAUSED, nemůžu poslat ping'); continue}

        let notify = Object.keys(edge.config.discord.roles).filter(n => n.startsWith('club_')).map(n => edge.config.discord.roles[n]).filter(n => !answered.includes(n)).map(n => guild.roles.cache.get(n))
        let errors = []
        let success = []
        for (let role of notify) {
          let members = role.members.filter(n => n._roles.includes(edge.config.discord.roles.position_trener))

          for (let member of members) {
            member = member[1]
            try {
              await member.user.send(`Ahoj, tvůj tým ještě nezareagoval na zprávu v <#${data.channel}>`) 
              success.push(member.user)
            } catch (e) {errors.push(member.user)}
          }
        }
        let embed = {title: `Notify ${data._id} eventu!`, description: `Sent to ${success.length}/${success.length+errors.length} members!`}
        if (errors.length) embed.description = embed.description + `\n\nErrors:\n${errors.join('\n')}`
        global.channels?.log?.send({ embeds: [embed] })
        data.lastPing = new Date().getTime() - 50000

        await edge.post('general', 'events', data)
        continue
      }

      let channel = await dc_client.channels.cache.get(data.channel)
      if (!channel) { console.error('Time management nenašel channel eventu ' + data._id); continue}
      let message = data.message ? await channel?.messages.fetch(data.message).catch(e => {}) : null
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