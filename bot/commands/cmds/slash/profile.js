
const { ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder } = require('discord.js')

module.exports = {
    name: 'profile',
    description: 'Zobrazuje profil uživatele!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105544649080320110', type: 'ROLE', permission: true}],
    options: [
      {
        name: 'user',
        description: 'Koho chceš vidět? (DEV ONLY)',
        type: 3,
        required: false,
        autocomplete: true
      },
      {
        name: 'event',
        description: 'Jaký event chceš vidět? (DEV ONLY)',
        type: 3,
        required: false,
        autocomplete: true
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })
      /* - not secured, have fun glitching in :D */

      let guild = dc_client.guilds.cache.get('1105413744902811688')

      let teams = (edge.discord.roles.teams || await edge.get('general', 'clubs', {})).map(n => n.id)

      let user = interaction.options.getString('user') || interaction.user.id
      if (user == 'none') user = interaction.user.id

      let event = interaction.options.getString('event')
      if (event == 'none') event = null

      let trenerRole = guild.roles.cache.get(edge.config.discord.roles.position_trener)
      let isTrener = user && user !== 'none' ? (trenerRole.members.get(user) ? true : false) : true

      if (event) {
        let data;
        let type = Number(event) ? 'msg' : 'event'
        if (type == 'msg') data = await edge.get('general', 'messages', {_id: event})
        else data = await edge.get('general', 'events', {_id: event})
        if (!data.length) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nebyla nalezena žádná data ${type == 'msg' ? 'messsage ' : ''}eventu!`, color: 15548997 }]})
        data = data[0]
  
        let mode = data.mode || data.ack || 'none'
        if (mode == 'none') return interaction.editReply({ content: 'Event nemá acknowlige!' })
        let reacted = []
        let notReacted = []
        if (type == 'msg') {
          if (mode == 'user') reacted = data.read
          else data.read.forEach(n => {
            let member = guild.members.cache.get(n)
            if (!member) return
            let role = member?._roles.find(n => teams.includes(n))
            if (!reacted.includes(role)) reacted.push(role)
          })
        } else {
          data.answers.split('|').forEach(n => {data[n].forEach(a => reacted.push(a?.id || a))})
        }
        if (mode == 'user') {
          notReacted = trenerRole.members.filter(n => n._roles.includes(edge.config.discord.roles.position_trener) && !reacted.includes(n.id)).map(n => n.id)
        } else {
          notReacted = teams.filter(n => !reacted.includes(n))//.map(n => guild.roles.cache.get(n))
        }
        let ne = { title: type == 'msg' ? data.info.find(a => a.type == 'title')?.value || data.id : data._id, description: `Neodpověděli:\n${notReacted.map(n => `<@${mode == 'user' ? '' :'&'}${n}>`).join('\n')}`}
        let ano = { title: type == 'msg' ? data.info.find(a => a.type == 'title')?.value || data.id : data._id, description: `Odpověděli:\n${reacted.map(n => `<@${mode == 'user' ? '' :'&'}${n}>`).join('\n')}`}
        return interaction.editReply({ embeds: [ne, ano], allowedMentions: {parse: []}})
      }

      let events = await edge.get('general', 'events', {})
      let messages = await edge.get('general', 'messages', {})
      let verify = await edge.get('general', 'users', {_id: user}).then(n => n[0])

      if (!verify) return interaction.editReply({ content: `<@${user}> není verifikovaný! (potřebuju to na zobrazení jména :D)`, allowedMentions: {parse: []}})

      notReacted = []
      let club = guild.members.cache.get(user)?._roles.find(n => teams.includes(n))

      for (data of [...events, ...messages]) {

        let type = Number(data._id) ? 'msg' : 'event'

        let mode = data.mode || data.ack || 'none'
        if (mode == 'none') continue;

        
        if (type == 'msg') {
          if (mode == 'user' && !data.read.includes(user)) notReacted.push(data)
          else if (mode == 'team') {
            let reactedTeams = []
            data.read.forEach(n => {
              let member = guild.members.cache.get(n)
              if (!member) return
              let role = member?._roles.find(n => teams.includes(n))
              if (!reactedTeams.includes(role)) reactedTeams.push(role)
            })
            if (!reactedTeams.includes(club)) notReacted.push(data)
          }
        } else {

          let reacted = []
          data.answers.split('|').forEach(n => {data[n].forEach(a => reacted.push(a?.id || a))})
          if (mode == 'user' && !reacted.includes(user)) notReacted.push(data)
          else if (mode == 'team' && !reacted.includes(club)) notReacted.push(data)
        }
      }

      let fields = []
      fields.push({name: 'Tým:', value: club ? `<@&${club}>` : 'Žádný', inline: false})

      if (verify.list.length && !(verify.list.length == 1 && verify.list[0] == club)) fields.push({ name: 'Whitelist:', value: verify.list.map(n => `<@&${n}>`).join('\n')})
      if (verify.blacklist.length) fields.push({ name: 'Blacklist:', value: verify.blacklist.map(n => `<@&${n}>`).join('\n')})
      if (notReacted.length && isTrener) fields.push({ name: 'Nezareagováno:', value: notReacted.map(n => `[${n.info?.find(n => n.type == 'title')?.value || n._id}](${n.msgUrl}) (${n.type.replace('msg', 'oznámení').replace('hlasovani', 'hlasování')})`).join('\n'), inlune: false})

      let desc = undefined
      if (user !== interaction.user.id) desc = `Ping: <@${user}>`

      return interaction.editReply({ embeds: [{title: 'Profil uživatele '+ verify.name, description: desc, fields: fields, color: verify.color || 13287575}]})
      
    },
    autocomplete: async (edge, interaction) => {
      let current = interaction.options._hoistedOptions.filter(n => n.focused)[0].name

      if (current == 'event') {
        let events = await edge.get('general', 'events', {})
        let messages = await edge.get('general', 'messages', {}).then(n => n.filter(a => a.ack !== 'none'))

        let show = [...events, ...messages].map(n => { return {name: n.info?.find(n => n.type == 'title')?.value || n._id, value: n._id} })

        let focused = interaction.options.getFocused()

        let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25)
        return interaction.respond(z.length ? z : [{ value: 'none', name: 'Nebyl nalezen žádný event'}])
      } else {
        let users = await edge.get('general', 'users', {})

        let show = users.map(n => { return {name: n.name, value: n._id, user: dc_client.users.cache.get(n._id)} })

        let focused = interaction.options.getFocused()
        let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase()) || n.user.username.toLowerCase().includes(focused.toLowerCase() || n.value.includes(focused))).slice(0, 25)
        return interaction.respond(z.length ? z : [{ value: 'none', name: 'Nebyl nalezen žádný event'}])
      }
      
    },
}