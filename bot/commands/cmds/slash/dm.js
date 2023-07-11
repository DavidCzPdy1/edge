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
      let id = new Date().getTime()

      let select = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`dm_cmd_select_${id}`).setPlaceholder('Vyber role').setMinValues(1).setMaxValues(8).addOptions(
        new StringSelectMenuOptionBuilder().setLabel('Trenéři').setValue('1105544649080320110').setDescription('Všichni trenéři'),
        new StringSelectMenuOptionBuilder().setLabel('Atletico Maják').setValue('1108825493739929620').setDescription('Trenéři ze Vsetína'),
        new StringSelectMenuOptionBuilder().setLabel('Arrows Chotěboř').setValue('1108833486321758291').setDescription('Trenéři z Chotěboře'),
        new StringSelectMenuOptionBuilder().setLabel('Hammers Havířov').setValue('1108825718776926208').setDescription('Trenéři z Havířova'),
        new StringSelectMenuOptionBuilder().setLabel('Micropachycephalosauři').setValue('1108825861190340720').setDescription('Trenéři z Poděbrad'),
        new StringSelectMenuOptionBuilder().setLabel('Poletíme').setValue('1108825185932542102').setDescription('Trenéři z Počernic'),
        new StringSelectMenuOptionBuilder().setLabel('Rakety Žižkoff').setValue('1108825318069903443').setDescription('Trenéři z Žižkova'),
        new StringSelectMenuOptionBuilder().setLabel('Sand Fox').setValue('1108825782001860730').setDescription('Trenéři z Písku'),
        new StringSelectMenuOptionBuilder().setLabel('Sky Divers').setValue('1108825076083720263').setDescription('Trenéři z Havlíčkova Brodu'),
      ));
      let buttons = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`dm_cmd_send_${id}`).setStyle(3).setLabel('POSLAT'))
      await interaction.editReply({ content: msg, embeds: [{ title: 'Hromadná zpráva', description: `Zpráva:\n\`${msg}\``, color: 9264288 }], components: [select, buttons]})


    },
    select: async (edge, interaction) => {
      await interaction.update({ type: 6 })

      let id = interaction.customId.split('_')[3]

      edge.sendDm[id] = {
        roles: interaction.values,
        msg: interaction.message.content
      }

      interaction.editReply({ embeds: [{ title: 'Hromadná zpráva', description: `Zpráva:\n\`${interaction.message.content}\`\n\nPošle se:\n${interaction.values.map(n => `<@&${n}>`).join('\n')}`, color: 9264288 }]})

    },
    send: async (edge, interaction) => {
      await interaction.update({ type: 6 })
      let id = interaction.customId.split('_')[3]

      let guild = dc_client.guilds.cache.get('1105413744902811688')
      if (!guild) return interaction.followUp({ content: 'Nenašel jsem guildu!', ephemeral: true })

      let data = edge.sendDm[id]
      if (!data) return interaction.followUp({ content: 'Nenašel jsem nastavení zprávy, zkus znovu prosím nastavit role!', ephemeral: true })

      let msg = data.msg
      let users = data.roles.map(n => guild.roles.cache.get(n)).map(n => n.members).map(n => Array.from(n.values())).flat().filter(n => n._roles.includes('1105544649080320110')).filter(unique).map(n => n.user)

      await interaction.editReply({ content: `\`${users.length}\`x posílám zprávu`, components: [], embeds: []})
      
      let errors = []
      let sent = users.length
      for (let user of users) {
        await user?.send({ content: msg }).catch(e => {
          sent -= 1
          errors.push(user)
        })
      }
  
      await interaction.editReply({ content: `Poslané zprávy: \`${sent}/${users.length}\`` })


      dc_client.channels.cache.get('1106243507527635005')?.send({ content: msg, embeds: [{ title: 'Bulk message', description: `\`${sent}/${users.length}\` messages sent to\n${data.roles.map(n => `<@&${n}>`).join('\n')}\n\n`+ (errors.length ? 'Errors:\n' + errors.join(', ') : ''), color: errors.length ? 15548997: 2067276 }] })

    }
}