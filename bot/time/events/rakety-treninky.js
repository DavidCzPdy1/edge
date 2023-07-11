
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, MentionableSelectMenuBuilder } = require('discord.js')
const eventName = module.filename.includes('/') ? module.filename.split('/').filter(n => n.endsWith('.js'))[0].split('.')[0] : module.filename.split('\\').filter(n => n.endsWith('.js'))[0].split('.')[0]


module.exports = {
  name: eventName,
  description: "Time event manages trenings for Rakety Žižkoff",
  emoji: '📜',
  time: '0 */5 * * * *', //'*/10 * * * * *'
  ignore: '* * * * * *', //'sec min hour den(mesic) mesic den(tyden)'
  onstart: false,
  run: async (edge, options) => {

    let guild = dc_client.guilds.cache.get('1122995611621392424')
    if (!guild) return console.error('Nenašel jsem Rakety Discord server! (time event)')
    
    let google = edge.google

    let event = await google.getCalendar(google.rCalendarId).then(n => n[0])

    let data = await edge.get('rakety', 'treninky', {}).then(n => n.filter(a => !a.ended)[0])

    if (!data && !event) return
    if (!data) data = newData(event)

    // END EVENT NOW
    if (new Date().getTime() > new Date(data.end.dateTime)) {
      data.ended = true
      if (data.message) {
        let message = await dc_client.channels.cache.get(data.channel).messages.fetch(data.message).catch(e => {})
        if (message) {
          let selectMenu = new ActionRowBuilder().addComponents(
            new MentionableSelectMenuBuilder().setCustomId('rakety-hlasovani_cmd_treninkEdit_'+data._id).setPlaceholder('Choose One of EDIT roles & some users to toggle').setMinValues(2).setMaxValues(20)
          )
          await dc_client.channels.cache.get('1128283058034966548')?.send({embeds: message.embeds, components: [selectMenu]})
          await message.delete()
        }
      }
      await edge.post('rakety', 'treninky', data)

      if (!event) return
      data = newData(event)
    }


    if (!data.message) {

      let buttons = new ActionRowBuilder()
      for (let answer of data.answers.split('|')) {
        buttons.addComponents(new ButtonBuilder().setCustomId(`rakety-hlasovani_cmd_dochazka_${data._id}_${answer}`).setStyle(2).setLabel(answer).setDisabled(false))
        data[answer] = []
      }
      let embed = getEmbed(data, {guild: guild})
      
      let msg = {embeds: [embed], components: [buttons], content: `[<@&1128260094556123227>]`, allowedMentions: { parse: ['roles']} }

      let channel = dc_client.channels.cache.get(data.channel)
      if (!channel) return console.error(`Nenašel jsem kanál s id ${channel}\n(RAKETY DC)`)
      let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
      if (!access) return console.error(`Nemám oprávnění posílat embed zprávy do ${channel}\n(RAKETY DC)`)

      let message = await channel.send(msg)
      data.msgUrl = message.url
      data.message = message.id
      await edge.post('rakety', 'treninky', data)
    }
    
  }
}



function newData(event) {
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
    channel: '1128258116694310922',
    pings: 0,
    pingsData: [],
    created: new Date().getTime(),
    format: 'mention'||'text',
    
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
      color: 14666022,
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