
const { ActionRowBuilder, ButtonBuilder } = require('discord.js')
const axios = require('axios')

module.exports = {
    name: 'verify',
    description: 'Verification for EDGE Discord Server!',
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
      {
        name: 'custom',
        description: 'Funkce pro trenéry',
        type: 3,
        required: false,
        autocomplete: true
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

      let guild = dc_client.guilds.cache.get('1105413744902811688')
      if (!guild) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem EDGE Discord server!', color: 15548997, footer: { text: 'EDGE /verify cmd' } }]})

      let ikona = guild?.iconURL() || ''

      let jmeno = interaction.options.getString('jmeno')
      let tym = interaction.options.getString('tym')

      let custom = interaction.options.getString('custom')
      let member = custom ? guild.members.cache.get(custom) : interaction.member || guild.members.cache.get(interaction.user.id)
      if (custom && !edge.handlePerms([{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}], interaction)) return interaction.editReply({ embeds: [{ title: 'ERROR', description: 'Nemáš oprávnění na custom verify!', color: 15548997, footer: { text: 'EDGE /verify cmd' } }]})
      if (custom && custom == 'ne' || !member) return interaction.editReply({ embeds: [{ title: 'ERROR', description: 'Nenašel jsem custom hráče!', color: 15548997, footer: { text: 'EDGE /verify cmd' } }]})

      if (jmeno === 'unverify') {
        await edge.delete('general', 'users', {_id: member.user.id})
        edge.discord.roles.updateRoles([member.user.id])
        return interaction.editReply({ embeds: [{ title: 'SECRET UNVERIFY', description: `Unverifikoval jsi uživatele ${member.user}!`, color: 15548997, footer: { text: 'EDGE /verify cmd' } }]})
      }


      let embed = {
        title: custom ? `Verifikoval/a jsi ${member.user.username} jako ${jmeno}` : `Verifikoval/a ses jako ${jmeno}`,
        description: 'Nepožádal/a jsi o roli žádného týmu.\nPokud v budoucnu budeš chtít nějakou týmovou roli, použit tento command znovu',
        color: 16763480
      }

      let user = await edge.get('general', 'users', {_id: member.user.id})
      if (user.length) {
        user = user[0]
        if (user.name !== jmeno) embed.title = custom ? `Změnil/a jsi jméno ${member.user.username} z \`${user.name}\` na \`${jmeno}\`` : `Změnil/a sis jméno z \`${user.name}\` na \`${jmeno}\``;
        else embed.title = custom ? `${member.user.username} zůstalo jméno \`${jmeno}\`!` : `Zůstalo ti jméno \`${jmeno}\``;

        if (user.team == tym) embed.description = custom ? `${member.user} je nadále členem <@&${tym}>` : `Nadále jsi členem <@&${tym}>`
        else if (user.team === tym && tym == 'ne');
        else if (user.team !== tym || user.team == 'ne') user.requested = tym

        user.name = jmeno
      } else {
        user = {_id: member.user.id, name: jmeno, team: 'ne', list: [], blacklist: []}
        try {
          if (process.env.namesApi) {
            let url = `https://api.parser.name/?api_key=${process.env.namesApi}&endpoint=extract&text=${jmeno.replaceAll(' ', '%20')}`
            let result = await axios.get(url)
            if (result.data.data?.length) {
              let gender = result.data.data[0].parsed.name.firstname.gender
              if (gender == 'm') user.gender = 'M'
              else if (gender == 'f') user.gender = 'W'
            }
          }
        } catch (e) {}
        
        if (tym !== 'ne') {
          user.requested = tym;
        }
      }


      if (user.requested) {
        if (user.requested == 'ne') {
          embed.description = custom ? `Odstranil jsi ${member.user} týmovou roli!` : 'Odstranil sis týmovou roli!'
          user.team = 'ne'
        } else {
          let role = guild.roles.cache.get(tym)
          if (!role) return interaction.editReply({ embeds: [{ title: 'Neplatný tým!', color: 15548997, footer: { text: 'EDGE /verify cmd' } }]})

          if (user.channel) {
            user.message = await guild.channels.cache.get('1109548259187380275').messages.fetch(user.channel)
            if (!user.message) user.channel = undefined
          }
          if (user.blacklist.includes(tym)) embed.description = custom ? `${member.user} nemá přístup k ${role} roli!` : `Nemáš možnost mít přístup k ${role} roli!`
          else if (custom) {
            embed.description = `Změnil jsi roli ${member.user} na <@&${tym}>!`
            user.team = tym
            if (!user.list.includes(tym)) user.list.push(tym)
          }
          else if (user.message) {
            embed.description = 'Už chceš ' + user.message.embeds[0].data.description.split(' chce ')[1]
            delete user.message
          }
          else if (!user.list.includes(tym)) {
            embed.description = `Požádal/a jsi o <@&${tym}> roli!\nPříslušný trenér byl informován a v blízké době se na Tvoji žádost podívá.`
    
            const buttons = new ActionRowBuilder()
              .addComponents(new ButtonBuilder().setCustomId(`verify_cmd_accept_${tym}_${member.user.id}`).setStyle(3).setLabel('PŘIJMOUT'))
              .addComponents(new ButtonBuilder().setCustomId(`verify_cmd_deny_${tym}_${member.user.id}`).setStyle(4).setLabel('NEPŘIJMOUT'))
      
            let proof = {
              title: 'Nová žádost o připojení k týmu',
              description: `${member.user} chce získat přístup k <@&${tym}> roli!`,
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

      
      if (user.channel && typeof user.channel !== 'string') user.channel = user.channel.id
      delete user.requested

      await edge.post('general', 'users', user)

      console.discord(`${embed.title}\n${embed.description}`)
      await interaction.editReply({ embeds: [embed]})
      edge.discord.roles.updateRoles([member.user.id])
    

    },
    autocomplete: async (edge, interaction) => {

      let current = interaction.options._hoistedOptions.filter(n => n.focused)[0].name

      if (current == 'tym') {
        let tymy = await edge.get('general', 'clubs', {})

        let show = tymy.map(n => { return {name: n.name, value: n.id} })
        let focused = interaction.options.getFocused()
  
        let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase()))
        return interaction.respond(z.length ? z : [{ value: 'ne', name: 'Nechci žádnou týmovou roli'}])
      } else if (current == 'custom') {
        if (!edge.handlePerms([{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}], interaction)) return interaction.respond([{ value: 'perms', name: 'Nemáš práva na custom verify!'}])

        let show = dc_client.guilds.cache.get('1105413744902811688')?.members?.cache?.filter(n => !n.user.bot)?.map(n => {return {name: n.nickname||n.user.username, value: n.id, fullName: n.user.username}})

        let focused = interaction.options.getFocused()
        let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase()) || n.value.toLowerCase().includes(focused.toLowerCase()) || n.fullName.toLowerCase().includes(focused.toLowerCase()))
        return interaction.respond(z?.length ? z : [{ value: 'ne', name: 'Nenašel jsem uživatele!'}])
      }
    },
    accept: async (edge, interaction) => {
      await interaction.update({ type:6 })
      let id = interaction.customId.split('_')[4]
      let tym = interaction.customId.split('_')[3]

      if (!interaction.member._roles.includes(edge.config.discord.roles.position_trener) || !interaction.member._roles.includes(tym) && !interaction.member._roles.includes(edge.config.discord.roles.position_edge) && interaction.user.id !== '378928808989949964') return interaction.followUp({ embeds: [{ title: 'Nemáš oprávnění přijmout člověka!', color: 15548997 }], ephemeral: edge.isEphemeral(interaction)})
    
      let user = await edge.get('general', 'users', {_id: id}).then(n => n[0])

      if (!user.list.includes(tym)) user.list.push(tym)
      if (!user.team || user.team == 'ne') user.team = tym
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

      if (!interaction.member._roles.includes(edge.config.discord.roles.position_trener) || !interaction.member._roles.includes(tym) && !interaction.member._roles.includes(edge.config.discord.roles.position_edge) && interaction.user.id !== '378928808989949964') return interaction.followUp({ embeds: [{ title: 'Nemáš oprávnění odmítnout člověka!', color: 15548997 }], ephemeral: edge.isEphemeral(interaction)})

      let user = await edge.get('general', 'users', {_id: id}).then(n => n[0])

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