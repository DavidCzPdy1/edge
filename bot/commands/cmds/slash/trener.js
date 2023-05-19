
module.exports = {
    name: 'trener',
    description: 'Manage EDGE trainers!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [
      {
        name: 'action',
        description: 'Co mám udělat?',
        type: 3,
        required: true,
        choices: [
          { value: 'list', name: 'Zobrazit list trenérů' },
          { value: 'add', name: 'Přidat trenéra' },
          { value: 'remove', name: 'Odstranit trenéra' },
          { value: 'ban', name: 'Skrytý agent' },
        ]
      },
      {
        name: 'user',
        description: 'Na koho to platí?',
        type: 6,
        required: false
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let action = interaction.options.getString('action')

      let trainer = await edge.get('general', 'clubs', {_id: 'list'}).then(n => n[0])

      if (action == 'list') {
        console.log(trainer)
        await interaction.editReply({ content: `SOON`})
        return
      }
      
      let user = interaction.options.getUser('user')
      if (!user) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nezadal jsi žádného uživalete!`, color: 15548997 }]})

      let ikona = interaction.guild.iconURL()

      if (action == 'add') {
        if (trainer.list.includes(user.id)) return interaction.editReply({ embeds: [{ title: 'ERROR v ADD cmd', description: `<@${user.id}> už na listině trenérů je!`, color: 15548997, footer: { text: 'Edge /trener cmd', icon_url: ikona } }]})

        trainer.list.push(user.id)

        await edge.post('general', 'clubs', trainer)

        await interaction.editReply({ embeds: [{ title: 'SUCCESS', description: `<@${user.id}> byl přidán na listinu trenérů!`, color: 2067276, footer: { text: 'Edge /trener cmd', icon_url: ikona } }]})

        return edge.discord.roles.updateRoles()
      } else if (action == 'remove') {
        if (!trainer.list.includes(user.id)) return interaction.editReply({ embeds: [{ title: 'ERROR v REMOVE cmd', description: `<@${user.id}> není na listině trenérů!`, color: 15548997, footer: { text: 'Edge /trener cmd', icon_url: ikona } }]})
        trainer.list = trainer.list.filter(n => n !== user.id)

        await edge.post('general', 'clubs', trainer)

        await interaction.editReply({ embeds: [{ title: 'SUCCESS', description: `<@${user.id}> byl odebrán z listiny trenérů!`, color: 2067276, footer: { text: 'Edge /trener cmd', icon_url: ikona } }]})
        return edge.discord.roles.updateRoles()
      } else if (action == 'ban') {

      }



      //let member = await interaction.guild.members.fetch(user.id)

      await interaction.editReply({ content: `SOON`})
    

    }
}