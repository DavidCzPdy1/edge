
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }


module.exports = {
    name: 'team-verify',
    description: 'Custom verify for edge clubs!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: ['Administrator'], type: 'PERMS', permission: true }],
    guild: ['1128307451066855515', '1122995611621392424'],
    options: [
      {
        name: 'jmeno',
        description: 'Jak se jmenuje? (\"Jméno Přijímení\")',
        type: 3,
        required: true,
      },
      {
        name: 'custom',
        description: 'Koho chceš verifikovat?',
        type: 3,
        required: true,
        autocomplete: true
      },
      {
        name: 'type',
        description: 'Jaké role mu chceš dát?',
        type: 3,
        required: true,
        autocomplete: true
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

      let jmeno = interaction.options.getString('jmeno')
      let custom = interaction.options.getString('custom')
      let type = interaction.options.getString('type')

      if (type == 'ne' || custom == 'ne') return interaction.editReply({ content: 'Neplatné nastavení commandu!' })

      let team = await edge.get('general', 'clubs', {}).then(n => n.find(a => a.server?.guild === interaction.guild.id))
      if (!team.server?.config?.buttons || !team?.server?.buttons) return interaction.editReply({ content: 'Daný tým nemá nastavené tlačítka!' })
      if (!team.server.buttons.find(a => a.id == type) && type !== 'smazat') return interaction.editReply({ content: 'Neplatný button!' })

      let dcUser = dc_client.users.cache.get(custom)
      if (!dcUser) return interaction.editReply({ content: 'Nenašel jsem uživatele!' })

      let user = await edge.get('general', 'users', {_id: custom }).then(n => n[0])
      if (!user) {
        if (type == 'smazat') return interaction.editReply({ content: 'Uživatel není verifikovaný!' })
        user = {_id: dcUser.id, name: jmeno, team: 'ne', list: [], blacklist: [], clubs: [{id: team._id, roles: team.server.buttons.find(a => a.id == type)?.roles || []}].filter(n => n.id)}
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
        
        if (team.server.buttons.find(a => a.id == type)?.title !== 'Návštěvník') {
          const buttons = new ActionRowBuilder()
              .addComponents(new ButtonBuilder().setCustomId(`verify_cmd_accept_${team.id}_${interaction.user.id}`).setStyle(3).setLabel('PŘIJMOUT'))
              .addComponents(new ButtonBuilder().setCustomId(`verify_cmd_deny_${team.id}_${interaction.user.id}`).setStyle(4).setLabel('NEPŘIJMOUT'))
      
          let proof = {
            title: 'Nová žádost o připojení k týmu',
            description: `${interaction.user} \`(${jmeno})\` chce získat přístup k <@&${team.id}> roli!`,
            color: team.color
          }
          let channel = dc_client.channels.cache.get('1109548259187380275')
          let msg = await channel?.send({ embeds: [proof], components: [buttons], content: `[<@&${team.id}>]`, allowedMentions: { parse: ['roles'] }})
          if (channel) user.channel = msg.id
        }
        
       
        console.discord(`${jmeno} - tymova custom verifikace jako typu jako ${type}`)
      } else {
        if (!user.clubs) user.clubs = []

        if (type == 'smazat') {
          user.clubs = user.clubs.filter(a => a.id !== team._id)
        } else {
          let club = user.clubs.find(a => a.id == team._id)
          if (!club) user.clubs.push({ id: team._id, roles: team.server.buttons.find(a => a.id == type)?.roles || []})
          else club.roles = team.server.buttons.find(a => a.id == type)?.roles || []
        }
      }

      await edge.post('general', 'users', user)

      interaction.editReply({ content: `Custom buttons uživatele ${dcUser} jako **${team.server.buttons.find(a => a.id == type)?.title || 'reset' }**.\nRole: ${user.clubs.find(a => a.id == team._id)?.roles?.map(n => `<@&${n}>`)||'žádné'}`, allowedMentions: {parse: []} })

      edge.discord.roles.updateRoles([user._id])
     
    },
    autocomplete: async (edge, interaction) => {

      let current = interaction.options._hoistedOptions.filter(n => n.focused)[0].name

      let team = await edge.get('general', 'clubs', {}).then(n => n.find(a => a.server?.guild === interaction.guild.id))
      if (!team.server?.config?.buttons || !team?.server?.buttons) return interaction.respond([{ value: 'ne', name: 'Daný tým nemá nastavené tlačítka!'}])

      if (current == 'custom') {
        if (!edge.handlePerms([{ id: '378928808989949964', type: 'USER', permission: true}, { id: ['Administrator'], type: 'PERMS', permission: true }], interaction)) return interaction.respond([{ value: 'perms', name: 'Nemáš práva na club verify!'}])

        let show = interaction.guild?.members?.cache?.filter(n => !n.user.bot)?.map(n => {return {name: n.nickname||n.user.username, value: n.id, fullName: n.user.username}})

        let focused = interaction.options.getFocused()
        let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase()) || n.value.toLowerCase().includes(focused.toLowerCase()) || n.fullName.toLowerCase().includes(focused.toLowerCase()))
        return interaction.respond(z?.length ? z : [{ value: 'ne', name: 'Nenašel jsem uživatele!'}])
      } else if (current == 'type') {
        let show = team.server.buttons.map(n => { return {name: n.title, value: n.id} })
        show.push({name: 'Odstranit buttony', value: 'smazat'})
        let focused = interaction.options.getFocused()
        
        let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase()))
        return interaction.respond(z.length ? z : [{ value: 'ne', name: 'Nenašel jsem danou kategorii!'}])
      }
    },
}