const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } = require("discord.js");
const axios = require('axios');
const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

module.exports = async (edge, interaction) => {
    let action = interaction.customId.split('_')[1]
    let id = interaction.customId.split('_')[2]

    let user;
    let team;

    if (action == 'button') {

      user = await edge.get('general', 'users', {_id: interaction.user.id}).then(n => n[0])
      team = await edge.get('general', 'clubs', {}).then(n => n.find(a => a.server?.guild === interaction.guild.id))
      if (!team) team = {}

      if (!user) {
          const modal = new ModalBuilder().setCustomId(`rozdeleni_verify_${id}`).setTitle(`Zadání jména!`)
          .addComponents(textBox({ id: 'jmeno', text: 'Jak se jmenuješ?', example: 'Jméno Příjmení', value: undefined, required: true}))

          return await interaction.showModal(modal);
      } else await interaction.reply({ ephemeral: true, content: 'Již jsi verifikovaný, brzy dostaneš příslušné role!' })

      if (!user.clubs) user.clubs = []
      let club = user.clubs.find(a => a.id == team._id)
      if (!club) user.clubs.push({ id: team._id, roles: team.server.buttons.find(a => a.id == id)?.roles || [], type: id})
      else {
        club.roles = team.server.buttons.find(a => a.id == id)?.roles || []
        club.type = id
      }
      
      if (!user.list.includes(team.id) && team.server.buttons.find(a => a.id == id)?.title !== 'Návštěvník' && !user.channel && !user.blacklist.includes(team.id)) {
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
        if (channel) user.channel = msg.channel.id
      }


      await edge.post('general', 'users', user)
        
    } else if (action == 'verify') {
        await interaction.update({ type: 6 })
        let jmeno = interaction.fields.fields.get('jmeno').value

        team = await edge.get('general', 'clubs', {}).then(n => n.find(a => a.server?.guild === interaction.guild.id))
        if (!team) team = {}
        
        user = {_id: interaction.user.id, name: jmeno, team: 'ne', list: [], blacklist: [], clubs: [{id: team._id, roles: team.server.buttons.find(a => a.id == id)?.roles || [], type: team.server.buttons.find(a => a.id == id)?.id || -1}].filter(n => n.id)}
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
        
        if (team.server.buttons.find(a => a.id == id)?.title !== 'Návštěvník') {
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
        
        await edge.post('general', 'users', user)
        console.discord(`${jmeno} - tymova verifikace jako typu #${id}`)
        await interaction.followUp({ ephemeral: true, content: 'Právě ses verifikoval, brzy dostaneš příslušné role!' })
    }
    edge.discord.roles.updateRoles([interaction.user.id])
}
