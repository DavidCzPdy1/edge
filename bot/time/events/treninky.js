
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, MentionableSelectMenuBuilder } = require('discord.js')
const eventName = module.filename.includes('/') ? module.filename.split('/').filter(n => n.endsWith('.js'))[0].split('.')[0] : module.filename.split('\\').filter(n => n.endsWith('.js'))[0].split('.')[0]


module.exports = {
  name: eventName,
  description: "Time event manages trenings for Edge Servers",
  emoji: '🦖',
  time: '0 */5 * * * *', //'*/10 * * * * *'
  ignore: '* * * * * *', //'sec min hour den(mesic) mesic den(tyden)'
  onstart: false,
  run: async (edge, options) => {

    let teams = await edge.get('general', 'clubs', {}).then(n => n.filter(a => a.server))

    let raketyU15 = { color: 15844367, id: '1108825318069903443', name: 'Rakety Žižkoff U15', server: { guild: '1122995611621392424', database: 'raketyU15', ping: { annoucment: '1128290333386608662', trenink: '1128260094556123227' }, calendar: 'jpbhl091kr2o1cf4ss4tubllqg@group.calendar.google.com', channels: { trenink: '1128258116694310922', archive: '1128283058034966548', annoucment: '1123221519150088204', turnaj: '1123221519150088204' }, roles: { trener: '1131955450049482792', member: '1131955550788268172' }, config: { treninky: true } } }
    //teams.push(raketyU15)

    let google = edge.google

    for (let team of teams) {
      let guild = dc_client.guilds.cache.get(team.server.guild)
      if (!guild) continue

      let modes = [['treninky', 'trenink', 'trénink'], ['turnaje', 'turnaj']]

      for (let filtr of modes) {
        if (!team.server.config[filtr[0]]) continue;

        let type = filtr.includes('trenink') ? 'trenink' : 'turnaj'

        let calendar;
        try { calendar = await google.getCalendar(team.server.calendar, type == 'trenink' ? 3 : 30).then(n => n.filter(a => filtr.some(b => a.summary.toLowerCase().includes(b)))) } catch (e) { console.error(`${team.name} nemá platný kaneldář!`);continue}
        if (!calendar) continue

        let data = await edge.get('teams', team.server.database, {}).then(n => n.filter(a => !a.ended && a.type == type))
        
        /* END */
        let end = data.filter(n => !calendar.map(a => a.id.replaceAll('_', '-')).includes(n._id) && !n.ended)

        for (let ended of end) {
          let cal = await google.fetchCalendar(team.server.calendar, ended._id.replaceAll('-', '_'))

          let message = db.message ? await dc_client.channels.cache.get(ended.channel)?.messages.fetch(ended.message).catch(e => {}) : null

          if (type == 'turnaj') {
            // TODO: delete role
          }

          if (cal?.status == 'confirmed') {
            ended.ended = true
            if (message) {
              try {
                let selectMenu = new ActionRowBuilder().addComponents(new MentionableSelectMenuBuilder().setCustomId('team-anketa_cmd_treninkEdit_'+team.server.database+'_'+ended._id).setPlaceholder('Choose One of EDIT roles & some users to toggle').setMinValues(2).setMaxValues(20))
                await dc_client.channels.cache.get(team.server.channels?.archive)?.send({embeds: message.embeds, components: [selectMenu]})
                await message.delete()
              } catch (e) {console.error(e)}
            }
            await edge.post('teams', team.server.database, ended)

          } else if (cal?.status == 'cancelled') {
            await message.delete()
            await edge.delete('general', 'turnaj', {_id: ended._id})
          }
        }

        /* HANDLE OLD & NEW */
        for (let event of calendar) {
          let id =  event.id.replaceAll('_', '-')
          let db = refreshDb(data.find(n => n._id == id) || {}, event, team)

          let embed = getEmbed(db, {guild: guild})

          try {
            if (db.message) {
              let message = await dc_client.channels.cache.get(db.channel)?.messages.fetch(db.message).catch(e => {})
              await message?.edit({ embeds: [embed] })
            }
          } catch (e) {console.error(e)}


          let anTime = type == 'trenink' ? (1000*60*60*24*3 + 1000*60*60*2) : 2629800000
          if (!db.message && new Date(db.start).getTime() < (new Date().getTime() + anTime)) {
  
            let buttons = new ActionRowBuilder()
            for (let answer of db.answers.split('|')) {
              buttons.addComponents(new ButtonBuilder().setCustomId(`team-anketa_cmd_dochazka_${team.server.database}_${db._id}_${answer}`).setStyle(2).setLabel(answer).setDisabled(false))
              db[answer] = []
            }
            
            let msg = {embeds: [embed], components: [buttons], content: team.server?.ping[type] ? `[<@&${team.server.ping[type]}>]` : undefined, allowedMentions: { parse: ['roles']} }
      
            let channel = dc_client.channels.cache.get(db.channel)
            if (!channel) { console.error(`Nenašel jsem kanál s id ${db.channel} - ${team.name} ${type}`); continue}
            let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
            if (!access) {console.error(`Nemám oprávnění posílat embed zprávy do ${channel} - ${team.name} ${type}`); continue}
      
            let message = await channel.send(msg)
            db.msgUrl = message.url
            db.message = message.id
          }

          if (type == 'turnaj' && db.message) {
            // handle role
          }

          await edge.post('teams', team.server.database, db)
        }


      }
    }
    
  }
}


function refreshDb(data, event, team) {
  let type = data.type || ['trenink', 'trénink'].some(a => event.summary.toLowerCase().includes(a)) ? 'trenink' : 'turnaj'

  let time = Math.floor(new Date(event.start.date || event.start.dateTime).getTime()/1000)
  let timeEnd = Math.floor(new Date(event.end.date || event.end.dateTime).getTime()/1000)

  if (!data._id) data._id = event.id.replaceAll('_', '-'),
  data.name = event.summary
  data.start = event.start.date || event.start.dateTime
  data.end = event.end.date || event.end.dateTime
  data.location = event.location ? `[${event.location.split(',')[0]}](https://www.google.com/maps/search/?api=1&query=${event.location.replaceAll(' ', '%20')})` : undefined
 
  data.channel = team.server.channels.trenink
  data.embed = {title: type == 'trenink' ? `Docházka na ${event.summary}` : `Přihláška na ${event.summary}`, description: `**Datum:** <t:${time}:f>\n${type == 'trenink' ? `**Od** <t:${time}:t> **do** <t:${timeEnd}:t>\nZačátek <t:${time}:R>`:`Počet dní: ${Math.ceil((data.start - data.end) / 1000/60/60/24 )}`}\n`, color: team.color}
  data.answers = type == 'trenink' ? 'Přijdu|Nepřijdu|Přijdu pozdě' : 'Pojedu|Nepojedu'
  data.mode = 'user',
  data.type = type
  data.channel = team.server.channels[type]
  data.format = 'mention'||'text'

  if (!data.created) data.created = new Date().getTime()
  data.updated = new Date().getTime()
  if (!data.ended) data.ended = false

  if (data.location) data.embed.description = data.embed.description + `\n**Místo:** [${event.location.split(',')[0]}](https://www.google.com/maps/search/?api=1&query=${event.location.replaceAll(' ', '%20')})\n`
  data.embed.description = data.embed.description + '\u200B'

  return data
}

function getEmbed (data, options = {}) {
  let embed =  {
      title: data.embed?.title || data.name || data._id,
      description: data.embed?.description || data.description,
      fields: data.answers?.split('|').map(n => { return {name: `${n.trim()} - 0`, value: `\u200B`, inline: true} }) || [],
      color: data.embed?.color || data.color || 14666022,
  }

  if (options.guild) {
    embed.fields = embed.fields.map(n => {
      let name = n.name.split(' - ')[0] + ` - ${data[n.name.split(' - ')[0]].length}`
      let value = data[n.name.split(' - ')[0]].map(a => {
        let id = a.id || a
        if (data.format == 'mention') return `<@${id}>`
        let mention = options.guild.members.cache.get(id)
        return mention?.nickname || mention?.user?.username
      }).join('\n')
      if (!value.length) value = '\u200B'
      return {name: name, value: value, inline: true}
    })
  }
  return embed
}