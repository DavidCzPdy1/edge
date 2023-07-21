
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, MentionableSelectMenuBuilder } = require('discord.js')
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'table',
  description: 'Table test command!',
  permissions: [{ id: '378928808989949964', type: 'USER', permission: true }, { id: '1105555145456107581', type: 'ROLE', permission: true }],
  options: [],
  type: 'slash',
  platform: 'discord',
  run: async (edge, interaction) => {
    await interaction.deferReply({ ephemeral: true })

    let data = await edge.get('general', 'clubs', {})
    data = data.find(n => n._id == 3)


    

/*
      edgeServers: [
        {
          name: 'Rakety Žižkoff',
          id: '1122995611621392424',
          database: 'rakety',
          channels: {
            trenink: '1128258116694310922',
            archive: '1128283058034966548',
            annoucment: '1123221519150088204'
          }
        },
        {
          name: 'Micropachycephalosauři',
          id: '1128307451066855515',
          database: 'podebrady',
          channels: {
            trenink: '1128307712552337419',
            archive: '1128307904341102592',
            annoucment: '1128330001641652305'
          }
        }
      ]
*/





    /*
    let message = await dc_client.channels.cache.get('1128283058034966548')?.messages.fetch('1128290866092585060')
    let selectMenu = new ActionRowBuilder().addComponents(
      new MentionableSelectMenuBuilder().setCustomId('rakety-hlasovani_cmd_treninkEdit_2uekpgit7q4r3e55b5licnju4b-20230711T133000Z').setPlaceholder('Choose One of EDIT roles & some users to toggle').setMinValues(2).setMaxValues(20)
    )
    await message.edit({ components: [selectMenu]})
  return
  */
  
  /*
    let guild = dc_client.guilds.cache.get('1105413744902811688')
    if (!guild) return interaction.editReply({ embeds: [{ title: 'Nenašel jsem EDGE Discord server!', color: 15548997 }] })

    for (let event of events) {
      await google.nahratData(event, {guild: guild})
      
    }
    */

    interaction.editReply({ content: 'Testing' })
  }
}