const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js')

module.exports = {
    name: 'dm',
    description: 'Message group of users!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [
      {
        name: 'message',
        description: 'Jaká zpráva?',
        type: 3,
        required: true
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let msg = interaction.options.getString('message')


      let select = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('dm_cmd_select').setPlaceholder('Vyber role').setMinValues(1).setMaxValues(2).addOptions(//.setMinValues(1).setMaxValues(10)
        new StringSelectMenuOptionBuilder().setLabel('Trenéři').setValue('1105544649080320110').setDescription('Všichni trenéři'),
        new StringSelectMenuOptionBuilder().setLabel('Micropachicephalosauři').setValue('1108825861190340720').setDescription('Trenéři z Poděbrad')
      ));
      let buttons = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`dm_cmd_send`).setStyle(3).setLabel('POSLAT'))
      await interaction.editReply({ content: msg, components: [select, buttons]})


    },
    select: async (edge, interaction) => {
      await interaction.update({ type: 6 })

      console.log(interaction)
      //interaction.values
    },
    send: async (edge, interaction) => {
      await interaction.update({ type: 6 })
      
      
  return
      let msg = interaction.message.content
      let members = []

      await interaction.editReply({ content: `Sending \`${msg}\` to \`${members.size}\` people`})
      
      let errors = []
      let sent = members.size;
      for (let member of members) {
        let user = member[1].user
        await user?.send({ content: msg }).catch(e => {
          sent -= 1
          errors.push(user)
        })
      }
  
      await interaction.editReply({ content: `Messages sent: \`${sent}/${members.size}\`` })


      dc_client.channels.cache.get('1106243507527635005')?.send({ content: msg, embeds: [{ title: 'Bulk message', description: `\`${sent}/${members.size}\` messages sent to ${role} members\n\n`+ (errors.length ? errors.join(', ') : ''), color: errors.length ? 15548997: 2067276 }] })

    }
}