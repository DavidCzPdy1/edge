
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, StringSelectMenuBuilder } = require('discord.js')

const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

module.exports = {
    name: 'team-config',
    description: 'Nastavení team configu!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: ['Administrator'], type: 'PERMS', permission: true }],
    guild: ['1128307451066855515', '1122995611621392424'],
    options: [],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let team = await edge.get('general', 'clubs', {}).then(n => n.find(a => a.server?.guild === interaction.guild.id))
      if (!team) return interaction.editReply({ content: 'Použij příkaz na podporovaném discord serveru!'})

      let options = [
        {label: 'Overall Nastavení', description: 'Jaké úlohy má bot plnit?', value: 'config'},
        {label: 'ID google kalendáře', description: 'Google kalendář na tréninky', value: 'calendar'},
        {label: 'ID kanálů', description: 'Kde se posílají zprávy', value: 'channels'},
        {label: 'ID ping rolí', description: 'Co se má označovat', value: 'ping'},
        {label: 'ID uživatelských rolí', description: 'Member / trainer', value: 'roles'},
      ]
      const menu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('team-config_cmd_gui_'+team._id).setPlaceholder(`Vyber nastavení`).addOptions(...options));

      
      
      await interaction.editReply({ embeds: [{ title: 'Nastavení serveru týmu ' + team.name, description: `${'Vyber jednu z kategoríí, kterou chceš upravit!'}`, color: 2982048}], components: [menu], ephemeral: true})
      

    },
    gui: async (edge, interaction) => {
      let type = interaction.values[0]

      let _id = interaction.customId.split('_')[3]
      

      let team = await edge.get('general', 'clubs', {_id: Number(_id)}).then(n => n[0])
      if (!team) return interaction.reply({ ephemeral: true, content: 'Error s id - tým nebyl nalezen'})

      let configDesc = {
        changeName: 'Mění nickname na "Jméno Příjmení"',
        splitRole: 'Přidává a odstraňuje automaticky split role (▬▬)',
        memberRole: 'Přidává automaticky roli, pokud je hráč členem týmu',
        trainerRole: 'Přidává automaticky trenérskou roli',
        treninky: 'Automaticky posílá docházku na tréninky'
      }

      if (type == 'config') {
        await interaction.update({ type: 6 })
        let buttons = []
        let b = 0
        let y = 0
        for (let nastaveni of Object.keys(team.server.config)) { 
          if (y > 4) {
            y = 0
            b++
          }
          if (!buttons[b]) buttons.push(new ActionRowBuilder())
          buttons[b].addComponents(new ButtonBuilder().setCustomId(`team-config_cmd_toggle_${_id}_${nastaveni}`).setStyle(team.server.config[nastaveni] ? 3 : 4).setLabel(nastaveni))
          y++
        }

        interaction.followUp({ embeds: [{ title: 'Overall nastavení týmu ' + team.name, description: Object.keys(team.server.config).map(n => `**${n}** - ${configDesc[n]||'CHybí popisek :D'}`).join('\n'), color: 298048}], components: buttons, ephemeral: true})

      } else if (type == 'calendar') {

        const modal = new ModalBuilder().setCustomId('team-config_ignore_calendar_'+_id).setTitle(`Edit ID Google kalendáře!`)
        .addComponents(textBox({ id: 'calendar', text: 'Jaké má být id kalendáře?', example: 'Google calendar ID - najdi na googlu', value: team.server.calendar || undefined, required: true, style: 2}))
      
        await interaction.showModal(modal);
        interaction = await interaction.awaitModalSubmit({filter: (n) => n.customId == 'team-config_ignore_calendar_'+_id, time: 180000}).catch(e => {})
        if (!interaction || !interaction?.fields) return;

        await interaction.update({ type: 6})

        let old = team.server.calendar
        team.server.calendar = interaction.fields.fields.map(n => { return {type: n.customId, value: n.value?.trim() }}).filter(n => n.value.length).find(n => n.type == 'calendar').value
        await edge.post('general', 'clubs', team)

        

        let reactEmbed = { title: 'Nastavení týmu ' + team.name + ' bylo změněno!', description: `**ID Google calendáře:**\n\n**Staré:** \`${old}\`\n**Nové:** \`${team.server.calendar}\``, color: 298055, footer: { text: `Reacted by ${interaction.user.username} | ${console.date()}`}}
        interaction.followUp({ ephemeral: true, embeds: [reactEmbed]})
        console.embed(reactEmbed)
        
      } else {
        const modal = new ModalBuilder().setCustomId(`team-config_ignore_${type}_`+_id).setTitle(`Edit ID kanálů / rolí?!`);
        let channels = type == 'channels' ? true : false

        let moznosti = Object.keys(team.server[type])
        for (let moznost of moznosti) {
          modal.addComponents(textBox({ id: moznost, text: `Jaké je ID ${moznost} ${channels ? 'kanálu' : 'role'} ?`, example: 'Např: 1128688011291410482', value: team.server[type][moznost] || undefined, required: true}))
        }
        await interaction.showModal(modal);
        interaction = await interaction.awaitModalSubmit({filter: (n) => n.customId == `team-config_ignore_${type}_`+_id, time: 180000}).catch(e => {})
        if (!interaction || !interaction?.fields) return;

        await interaction.update({ type: 6})

        let old = team.server[type]
        let res = {}
        let fields = []
        interaction.fields.fields.map(n => { return {type: n.customId, value: n.value?.trim() }}).filter(n => n.value.length).forEach((e, i) => { res[e.type] = e.value; fields.push({ name: e.type, value: `<${channels? '#' : '@&'}${old[e.type]}> ➜ <${channels? '#' : '@&'}${e.value}>`, inline: false})});(n => n.type == 'calendar').value
        team.server[type] = res
        await edge.post('general', 'clubs', team)

        

        let reactEmbed = { title: 'Nastavení týmu ' + team.name + ' bylo změněno!', fields: fields, color: 298055, footer: { text: `Reacted by ${interaction.user.username} | ${console.date()}`}}
        interaction.followUp({ ephemeral: true, embeds: [reactEmbed]})
        console.embed(reactEmbed)
      }
      
    },
    toggle: async (edge, interaction) => {
      let _id = interaction.customId.split('_')[3]

      let value = interaction.customId.split('_')[4]

      await interaction.update({ type: 6 })
      
      let team = await edge.get('general', 'clubs', {_id: Number(_id)}).then(n => n[0])
      if (!team) return interaction.followUp({ ephemeral: true, content: 'Error s id - tým nebyl nalezen'})

      team.server.config[value] = !team.server.config[value] 
      await edge.post('general', 'clubs', team)

      let components = interaction.message.components

      
      components.find(a => a.components.find(b => b.label == value)).components.find(b => b.label == value).data.style = team.server.config[value] ? 3 : 4 
      
      await interaction.editReply({ components: components})
      let reactEmbed = { title: 'Nastavení týmu ' + team.name + ' bylo změněno!', description: `${value} => ${team.server.config[value] }`, color: team.server.config[value] ? 298048 : 16711680, footer: { text: `Reacted by ${interaction.user.username} | ${console.date()}`}}
      console.embed(reactEmbed) 
    }
}