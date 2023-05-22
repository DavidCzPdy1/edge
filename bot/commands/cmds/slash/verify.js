
const { ActionRowBuilder, ButtonBuilder } = require('discord.js')

module.exports = {
    name: 'verify',
    description: 'Shows info about edge team!',
    permissions: [],
    options: [
      {
        name: 'jmeno',
        description: 'Jaké máš jméno? (\"Jméno Přijímení\")',
        type: 3,
        required: true,
      },
      {
        name: 'tym',
        description: 'Jsi členem nějakého týmu? (Pokud ne, napiš \"ne\")',
        type: 3,
        required: true,
        autocomplete: true
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      if (interaction.guild?.id !== '1105413744902811688') return interaction.editReply({ embeds: [{ title: 'Tento command lze použít pouze na EDGE Discord serveru!', color: 15548997, footer: { text: 'Edge /verify cmd' } }]})

      let ikona = interaction.guild.iconURL()

      let jmeno = interaction.options.getString('jmeno')
      let tym = interaction.options.getString('tym')

      let embed = {
        title: `Verifikoval/a ses jako ${jmeno}`,
        description: 'Nepožádal/a jsi o roli žádného týmu.\nPokud v budoucnu budeš chtít nějakou týmovou roli, použit tento command znovu',
      }

      let user = await edge.get('general', 'users', {_id: interaction.user.id})
      if (user.length) {
        user = user[0]
        if (user.name !== jmeno) embed.title = `Změnil/a sis jméno z \`${user.name}\` na \`${jmeno}\``;
        else embed.title = `Zůstalo ti jméno \`${jmeno}\``;

        if (interaction.member._roles.includes(tym)) embed.description = `Nadále jsi členem <@&${tym}>`
        else if (user.team === tym && tym == 'ne');
        else if (user.team !== tym || user.taam == 'ne') user.requested = tym

        user.name = jmeno
      } else {
        user = {_id: interaction.user.id, name: jmeno, team: 'ne', list: [], blacklist: []}
        if (tym !== 'ne') {
          user.requested = tym;
        }
      }


      if (user.requested) {
        if (user.requested == 'ne') {
          embed.description = 'Odstranil sis týmovou roli!'
        } else {
          let role = interaction.guild.roles.cache.get(tym)
          if (!role) return interaction.editReply({ embeds: [{ title: 'Neplatný tým!', color: 15548997, footer: { text: 'Edge /verify cmd' } }]})

          if (user.channel) {
            user.message = await interaction.guild.channels.cache.get('1109548259187380275').messages.fetch(user.channel)
            if (!user.message) user.channel = undefined
          }
          if (user.blacklist.includes(tym)) embed.description = `Nemáš možnost mít přístup k ${role} roli!`
          else if (user.message) {
            embed.description = 'Už chceš ' + user.message.embeds[0].data.description.split(' chce ')[1]
            delete user.message
          }
          else if (!user.list.includes(tym)) {
            embed.description = `Požádal/a jsi o <@&${tym}> roli!\nPříslušný trenér byl informován a v blízké době se na Tvoji žádost podívá.`
    
            const buttons = new ActionRowBuilder()
              .addComponents(new ButtonBuilder().setCustomId(`verify_cmd_accept_${tym}_${interaction.user.id}`).setStyle(3).setLabel('PŘIJMOUT'))
              .addComponents(new ButtonBuilder().setCustomId(`verify_cmd_deny_${tym}_${interaction.user.id}`).setStyle(4).setLabel('NEPŘIJMOUT'))
      
            let proof = {
              title: 'Nová žádost o připojení k týmu',
              description: `${interaction.user} chce získat přístup k <@&${tym}> roli!`,
              color: role.color
            }
            let channel = dc_client.channels.cache.get('1109548259187380275')
            if (!channel) await interaction.followUp({ embeds: [proof], components: [buttons], ephemeral: false, content: 'Bad error <@378928808989949964>'})
            else user.channel = await channel.send({ embeds: [proof], components: [buttons], content: `[<@&${tym}>]`, allowedMentions: { parse: ['roles'] }})
          } else {
            embed.description = `Změnil sis tým na <@&${tym}>!`
            user.team = tym
          }
        }
      }

      if (user.team !== 'ne') edge.discord.roles.roleAdd(interaction.member, interaction.guild.roles.cache.get(user.team))
      let keys = Object.keys(edge.config.discord.roles).filter(n => n.startsWith('club_'))
      
      for (let key of keys) {
        if (edge.config.discord.roles[key] !== user.team) await edge.discord.roles.roleRemove(interaction.member, interaction.guild.roles.cache.get(edge.config.discord.roles[key]))
      }

      if (user.channel && typeof user.channel !== 'string') user.channel = user.channel.id
      delete user.requested

      await edge.post('general', 'users', user)

      console.discord(`${embed.title}\n${embed.description}`)
      await interaction.editReply({ embeds: [embed]})
      edge.discord.roles.updateRoles([interaction.user.id])
    

    },
    autocomplete: async (edge, interaction) => {

      let tymy = await edge.get('general', 'clubs', {})

      let show = tymy.filter(n => n._id !== 'list').map(n => { return {name: n.name, value: n._id} })
      let focused = interaction.options.getFocused()

      return interaction.respond(show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).length ? show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25) : [{ value: 'ne', name: 'Nechci žádnou týmovou roli'}])
    },
    accept: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let id = interaction.customId.split('_')[4]
      let tym = interaction.customId.split('_')[3]

      if (!interaction.member._roles.includes(edge.config.discord.roles.position_trener) || !interaction.member._roles.includes(tym) && !interaction.member._roles.includes(edge.config.discord.roles.position_edge) && interaction.user.id !== '378928808989949964') return interaction.followUp({ embeds: [{ title: 'Nemáš oprávnění přijmout člověka!', color: 15548997 }], ephemeral: true})
    
      let user = await edge.get('general', 'users', {_id: id}).then(n => n[0])

      if (!user.list.includes(tym)) user.list.push(tym)
      user.team = tym
      user.channel = undefined
      await edge.post('general', 'users', user)

      let embed = interaction.message.embeds[0].data
      embed.description = embed.description.replace('chce získat', `získal/a`) + `\n*Accepted by ${interaction.user}*`
      embed.title = `Nová žádost přijata`
      embed.color = 16777215
      
      interaction.editReply({ embeds: [embed], components: [] })
      edge.discord.roles.updateRoles([id])
      //dc_client.users.cache.get(id).send({ embeds: [{ title: ''}] })
      
    },
    deny: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let id = interaction.customId.split('_')[4]
      let tym = interaction.customId.split('_')[3]

      if (!interaction.member._roles.includes(edge.config.discord.roles.position_trener) || !interaction.member._roles.includes(tym) && !interaction.member._roles.includes(edge.config.discord.roles.position_edge) && interaction.user.id !== '378928808989949964') return interaction.followUp({ embeds: [{ title: 'Nemáš oprávnění odmítnout člověka!', color: 15548997 }], ephemeral: true})

      let user = await edge.get('general', 'users', {_id: id}).then(n => n[0])

      user.blacklist.push(tym)

      if (!user.blacklist.includes(tym)) user.blacklist.push(tym)
      user.channel = undefined

      await edge.post('general', 'users', user)

      let embed = interaction.message.embeds[0].data
      embed.description = embed.description.replace('chce získat', `nezískal/a`) + `\n*Rejected by ${interaction.user}*`
      embed.title = `Nová žádost odmítnuta`
      embed.color = 0
      
      interaction.editReply({ embeds: [embed], components: [] })
      edge.discord.roles.updateRoles([id])
      // send dm
    }

}