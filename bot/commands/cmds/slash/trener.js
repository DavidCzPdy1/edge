
const { ActionRowBuilder, ButtonBuilder, RoleSelectMenuBuilder } = require('discord.js')

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

      let ikona = interaction.guild.iconURL()

      let action = interaction.options.getString('action')

      let data = await edge.get('general', 'clubs', {})

      let trainer = data.find(n => n._id == 'list')

      data = data.filter(n => n._id !== 'list')

      if (action == 'list') {

        let desc = trainer.list.map(n => {
          let tym = data.find(a => a.users.includes(n))
          let leader = trainer.leaders.includes(n) ? ' 👑' : ''
          tym = tym ? ` - ${tym.name}` : ''

          let res = {send: `<@${n}>` + leader + tym, sort: tym.length ? tym.slice(3).toLowerCase() : 'zzz' }
          return res
        }).sort((a, b) => {
          if (a.sort < b.sort) return -1;
          if (a.sort > b.sort) return 1;
          return 0;
        }).map(n => n.send).join('\n')


        let embed = { title: 'Seznam trenérů', description: desc, color: 2067276, footer: { text: 'Seznam trenérů', icon_url: ikona} }
        await interaction.editReply({ embeds: [embed]})
        return
      }
      
      let user = interaction.options.getUser('user')
      if (!user) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Nezadal jsi žádného uživalete!`, color: 15548997 }]})

  

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
      }

      await interaction.editReply({ content: `WIERD ERROR, kontaktuj prosím developera! [trener cmd - missing choice]`})
    

    }
}