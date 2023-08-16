
const { ActionRowBuilder, ButtonBuilder } = require('discord.js')

const printPerms = (perm) => perm.type == 'PERMS' ? ('**Server Permissions** ➜ ' + perm.id.join(', ')) : `<@${perm.type == 'USER' ? '' : '&' }${perm.id}> ➜ ${perm.permission ? 'appoved' : 'denined'}`;

module.exports = {
    name: 'command',
    description: 'Discord command info!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}],
    options: [
      {
        name: 'command',
        description: 'Jakého příkazu chceš zobrazit informace?',
        type: 3,
        required: true,
        autocomplete: true
      }
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

      let ikona = interaction.guild?.iconURL() || ''

      let command = interaction.options.getString('command') || null

      let cmd = edge.commands.get(command)
      if (!cmd) return interaction.editReply({ embeds: [{ title: 'ERROR', description: `Command nebyl nazen!`, color: 15548997 }]})


      let embed = {
        title: cmd.name.toUpperCase() + ' Command',
        fields: [{name: 'Description', value: cmd.description || 'Žádný', inline: false}, {name: 'Type', value: cmd.type, inline: false}]
      }

      if (cmd.type == 'slash' || cmd.type == 'modal') {
        let commands = await dc_client.application.commands.fetch()

        let prikaz = commands.find(n => n.name == command)
        if (!prikaz && interaction.guild) prikaz = interaction.guild.commands.cache.find(n => n.name == command)

        let id = prikaz?.id

        if (prikaz) embed.fields.push({name: 'ID', value: `</${cmd.name}:${id}> | \`</${cmd.name}:${id}>\``, inline: false})
      } else if (cmd.type == 'user') {
        let commands = await dc_client.application.commands.fetch()

        let prikaz = commands.find(n => n.name == command)
        if (!prikaz && interaction.guild) prikaz = interaction.guild.commands.cache.find(n => n.name == command)

        let id = prikaz?.id

        if (prikaz) embed.fields.push({name: 'ID', value: `\`${id}>\``, inline: false})
        
      } else if (cmd.type == 'sub') {

        let commands = await dc_client.application.commands.fetch()

        let prikaz = commands.find(n => n.name == cmd.name?.split('-')[0])
        if (!prikaz && interaction.guild) prikaz = interaction.guild.commands.cache.find(n => n.name == cmd.name?.split('-')[0])
        let id = prikaz?.id

        if (prikaz) embed.fields.push({name: 'ID', value: `</${cmd.name.replace('-', ' ')}:${id}> | \`</${cmd.name.replace('-', ' ')}:${id}>\``, inline: false})
      }

      if (cmd.permissions.length) embed.fields.push({name: 'Permissions', value: cmd.permissions.map(n => printPerms(n)).join('\n'), inline: false})

      
      let buttons =  new ActionRowBuilder()
      .addComponents(new ButtonBuilder().setCustomId('command_cmd_reload_'+cmd.name)/*.setLabel('oznameni')*/.setStyle(2).setDisabled(false).setEmoji('<:update:1109541398799208562>'))
     
      
      await interaction.editReply({ embeds: [embed], components: [buttons]})
    

    },
    autocomplete: async (edge, interaction) => {


      let show = edge.commands.map(n => { return {name: n.name, value: n.name} })
      let focused = interaction.options.getFocused()

      let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase())).slice(0, 25)
      return interaction.respond(z.length ? z : [{ value: 'null', name: 'Nebyl nalezen žádný command'}])
    },
    reload: async (edge, interaction) => {
      await interaction.update({ type: 6 })
      if (!edge.handlePerms(edge.commands.get('command').permissions, interaction)) return interaction.followUp({ content: 'Nemáš práva na reload commandů!', ephemeral: edge.isEphemeral(interaction)})
      let reply = await edge.createCommands()
      interaction.followUp({ content: reply, ephemeral: true})
    }
}