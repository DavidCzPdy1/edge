
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js')
const eventName = module.filename.includes('/') ? module.filename.split('/').filter(n => n.endsWith('.js'))[0].split('.')[0] : module.filename.split('\\').filter(n => n.endsWith('.js'))[0].split('.')[0]


module.exports = {
  name: eventName,
  description: "Turnaje LF",
  emoji: '�',
  time: '0 */5 * * * *', //'*/10 * * * * *'
  ignore: '* * * * * *', //'sec min hour den(mesic) mesic den(tyden)'
  onstart: false,
  run: async (edge, options) => {

    let google = edge.google
    
    let cal = google.edgeCal

    let data = await edge.get('general', 'turnaj', {})
    let calendar = await google.getCalendar(cal)

    /* END */
    let end = data.filter(n => !calendar.map(a => a.id.replaceAll('_', '-')).includes(n._id) && !n.ended)

    for (let db of end) {
      let res = await google.fetchCalendar(cal, db._id.replaceAll('-', '_'))

      let message = db.message ? await dc_client.channels.cache.get(db.channel)?.messages.fetch(db.message).catch(e => {}) : null

      if (res?.status == 'confirmed') {
        db.ended = true

        await message?.edit({ components: []})

        await edge.post('general', 'turnaj', db)
        /* OTHER ENDING EVENTS */
      } else if (res?.status == 'cancelled') {
        db.embed.description = 'Status - Zrušeno'
        await message?.edit({ components: [], embeds: [db.embed]})
        await edge.delete('general', 'turnaj', {_id: db._id})
        /* OTHER DELETION EVENTS */
      }
      
      
    }

    
    for (let event of calendar) {
      let id =  event.id.replaceAll('_', '-')
      let db = refreshDb(data.find(n => n._id == id) || {}, event)



      let buttons =  new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId('lf_cmd_LFApply_'+id).setLabel('Ano, nemám s kým hrát').setStyle(3))
        .addComponents(new ButtonBuilder().setCustomId('lf_cmd_LFDelete_'+id).setLabel('Chci zrušit žádost').setStyle(4))

      let channel = dc_client.channels.cache.get(db.channel)
      if (!channel) { console.error(`Nenašel jsem kanál s id ${db.channel} - ${db.name}`); continue}
      let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.EmbedLinks]);
      if (!access) { console.error(`Nemám oprávnění posílat embed zprávy do ${channel} - ${db.name}`); continue}


      if (db.message) {
        let message = await dc_client.channels.cache.get(db.channel)?.messages.fetch(db.message).catch(e => {})
        await message?.edit({ embeds: [db.embed], components: [buttons]})
      }

      if (!db.message && new Date(db.start).getTime() < new Date().getTime() + 2629800000) {
        let channel = dc_client.channels.cache.get('1110218138194301040')
        let message = await channel?.send({ content: `<@&1141059014227132486>`, embeds: [db.embed], components: [buttons], allowedMentions: {parse: ['roles']}})

        db.msgUrl = message.url
        db.message = message.id
      }

      await edge.post('general', 'turnaj', db)
    }
    
  }
}



function refreshDb(data, event) {
  if (!data._id) data._id = event.id.replaceAll('_', '-'),

  data.name = event.summary
  data.start = event.start.date || event.start.dateTime
  data.end = event.end.date || event.end.dateTime
  data.location = event.location ? `[${event.location.split(',')[0]}](https://www.google.com/maps/search/?api=1&query=${event.location.replaceAll(' ', '%20')})` : undefined
 
  let info = data.info || ''

  data.embed = {title: `Hledáš tým na ${event.summary}?`, description: `Čas: <t:${Math.floor(new Date(data.start).getTime()/1000)}:D>\n${info}`, color: 8411391}
  data.channel = '1110218138194301040'

  if (!data.created) data.created = new Date().getTime()
  data.updated = new Date().getTime()
  if (!data.ended) data.ended = false

  if (!data.players) data.players = []
    
  return data
}


