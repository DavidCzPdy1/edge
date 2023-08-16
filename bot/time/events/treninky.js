
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

    let a = { _id: 6, color: 15844367, id: '1108825318069903443', name: 'Rakety Žižkoff',
      server: { guild: '1122995611621392424', database: 'raketyU15',
        ping: { annoucment: '1128290333386608662', trenink: '1128260094556123227' },
        calendar: 'jpbhl091kr2o1cf4ss4tubllqg@group.calendar.google.com',
        channels: { trenink: '1128258116694310922', archive: '1128283058034966548', annoucment: '1123221519150088204', turnaj: '1123221519150088204' },
        roles: { trener: '1131955450049482792', member: '1131955550788268172' },
        config: { treninky: true }
      },
    }
    //teams.push(a)

    let google = edge.google

    for (let team of teams) {
      let guild = dc_client.guilds.cache.get(team.server.guild)
      if (!guild) continue

      if (team.server.config?.treninky) {
        let calendar = await google.getCalendar(team.server.calendar).then(n => n.filter(a => a.summary.toLowerCase().includes(`trenink`) || a.summary.toLowerCase().includes(`trénink`))[0])
        let data = await edge.get('teams', team.server.database, {}).then(n => n.filter(a => !a.ended && a.type == 'trenink')[0])
        if (!data && !calendar) continue
        if (!data) data = newData(calendar, team)
  
        // END EVENT NOW
        if (new Date().getTime() > new Date(data.end.dateTime)) {
          data.ended = true
          if (data.message) {
            let message = await dc_client.channels.cache.get(data.channel).messages.fetch(data.message).catch(e => {})
            if (message) {
              let selectMenu = new ActionRowBuilder().addComponents(
                new MentionableSelectMenuBuilder().setCustomId('team-anketa_cmd_treninkEdit_'+team.server.database+'_'+data._id).setPlaceholder('Choose One of EDIT roles & some users to toggle').setMinValues(2).setMaxValues(20)
              )
              await dc_client.channels.cache.get(team.server.channels.archive)?.send({embeds: message.embeds, components: [selectMenu]})
              await message.delete()
            }
          }
          await edge.post('teams', team.server.database, data)
  
          if (!calendar) continue
          data = newData(calendar, team)
        }
  
        // NEW EVENT NOW
        if (!data.message) {
  
          let buttons = new ActionRowBuilder()
          for (let answer of data.answers.split('|')) {
            buttons.addComponents(new ButtonBuilder().setCustomId(`team-anketa_cmd_dochazka_${team.server.database}_${data._id}_${answer}`).setStyle(2).setLabel(answer).setDisabled(false))
            data[answer] = []
          }
          let embed = getEmbed(data, {guild: guild})
          
          let msg = {embeds: [embed], components: [buttons], content: team.server?.ping?.trenink ? `[<@&${team.server.ping.trenink}>]` : undefined, allowedMentions: { parse: ['roles']} }
    
          let channel = dc_client.channels.cache.get(data.channel)
          if (!channel) { console.error(`Nenašel jsem kanál s id ${data.channel} - ${team.name} treninky`); continue}
          let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
          if (!access) {console.error(`Nemám oprávnění posílat embed zprávy do ${channel} - ${team.name} treninky`); continue}
    
          let message = await channel.send(msg)
          data.msgUrl = message.url
          data.message = message.id
          await edge.post('teams', team.server.database, data)
        }

      }

      if (team.server.config?.turnaje) {
        let calendar = await google.getCalendar(team.server.calendar).then(n => n.filter(a => a.summary.toLowerCase().includes(`turnaj`))[0])
        let data = await edge.get('teams', team.server.database, {}).then(n => n.filter(a => !a.ended && a.type == 'turnaj')[0])
        if (!data && !calendar) continue
        if (!data) data = newData(calendar, team)
        data.type = 'turnaj'
        data.channel = team.server.channels.turnaj
  
        // END EVENT NOW
        if (new Date().getTime() > new Date(data.end.dateTime)) {
          data.ended = true
          if (data.message) {
            let message = await dc_client.channels.cache.get(data.channel).messages.fetch(data.message).catch(e => {})
            if (message) {
              let selectMenu = new ActionRowBuilder().addComponents(
                new MentionableSelectMenuBuilder().setCustomId('team-anketa_cmd_treninkEdit_'+team.server.database+'_'+data._id).setPlaceholder('Choose One of EDIT roles & some users to toggle').setMinValues(2).setMaxValues(20)
              )
              await dc_client.channels.cache.get(team.server.channels.archive)?.send({embeds: message.embeds, components: [selectMenu]})
              await message.delete()
            }
          }
          await edge.post('teams', team.server.database, data)
  
          if (!calendar) continue
          data = newData(calendar, team)
        }
  
        // NEW EVENT NOW
        if (!data.message) {
  
          let buttons = new ActionRowBuilder()
          for (let answer of data.answers.split('|')) {
            buttons.addComponents(new ButtonBuilder().setCustomId(`team-anketa_cmd_dochazka_${team.server.database}_${data._id}_${answer}`).setStyle(2).setLabel(answer).setDisabled(false))
            data[answer] = []
          }
          let embed = getEmbed(data, {guild: guild})
          
          let msg = {embeds: [embed], components: [buttons], content: team.server?.ping?.trenink ? `[<@&${team.server.ping.trenink}>]` : undefined, allowedMentions: { parse: ['roles']} }
    
          let channel = dc_client.channels.cache.get(data.channel)
          if (!channel) { console.error(`Nenašel jsem kanál s id ${data.channel} - ${team.name} turnaje`); continue}
          let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
          if (!access) {console.error(`Nemám oprávnění posílat embed zprávy do ${channel} - ${team.name} turnaje`); continue}
    
          let message = await channel.send(msg)
          data.msgUrl = message.url
          data.message = message.id
          await edge.post('teams', team.server.database, data)
        }

      }


    }
    
  }
}



function newData(event, team) {
  let time = Math.floor(new Date(event.start.dateTime).getTime()/1000)
  let timeEnd = Math.floor(new Date(event.end.dateTime).getTime()/1000)
  let data = {
    _id: event.id.replaceAll('_', '-'),
    name: event.summary,
    start: event.start,
    end: event.end,

    question: `Docházka na ${event.summary}`,
    description: `**Datum:** <t:${time}:f>\n**Od** <t:${time}:t> **do** <t:${timeEnd}:t>\nZačátek <t:${time}:R>\n`,
    answers: 'Přijdu|Nepřijdu|Přijdu pozdě',
    time: null,
    mode: 'user',
    type: 'trenink',
    channel: team.server.channels.trenink,
    pings: 0,
    pingsData: [],
    created: new Date().getTime(),
    format: 'mention'||'text',

    color: team.color,
    
    ended: false
  }

  if (event.location) data.description = data.description = data.description + `\n**Místo:** [${event.location.split(',')[0]}](https://www.google.com/maps/search/?api=1&query=${event.location.replaceAll(' ', '%20')})\n`
  data.description = data.description + '\u200B'
  return data
}

function getEmbed (data, options = {}) {
  let embed =  {
      title: data.question || data._id,
      description: data.description,
      fields: data.answers?.split('|').map(n => { return {name: `${n.trim()} - 0`, value: `\u200B`, inline: true} }) || [],
      color: data.color || 14666022,
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