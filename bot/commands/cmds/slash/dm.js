
module.exports = {
    name: 'dm',
    description: 'Message group of users!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [
      {
        name: 'role',
        description: 'Komu všemu mám napsat zprávu?',
        type: 8,
        required: true
      },
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


      await interaction.guild.members.fetch()
      let role = interaction.options.getRole('role')
      let members = role.members
  
      let msg = interaction.options.getString('message')

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