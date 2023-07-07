
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
      if (!data.time) continue;
      else if (data.time > new Date().getTime()) {
        if (!data.pings || data.mode !== 'team') continue;

        let pings = data.pingsData.filter(n => !n.pinged)

        if (!pings.length) continue;
        if (pings[0].pingAt > new Date().getTime()) continue;
        console.log(pings)

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
              await member.user.send({ content: `Ahoj, tvůj tým ještě nezareagoval na zprávu v <#${data.channel}>\nReakce končí za <t:${data.time/1000}:R>` }) 
              success.push(member.user)
            } catch (e) {errors.push(member.user)}
          }
        }

        data.pingsData.find(n => n.id == pings[0].id).pinged = true

        let embed = {title: `Notify ${data._id} eventu!`, description: `Sent to ${success.length}/${success.length+errors.length} members!`}
        if (errors.length) embed.description = embed.description + `\n\nErrors:\n${errors.join('\n')}`
        global.channels?.log?.send({ embeds: [embed] })

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