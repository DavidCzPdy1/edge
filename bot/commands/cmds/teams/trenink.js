
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }
const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

module.exports = {
    name: 'trenink',
    description: 'Statistiky z tréninků!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: ['Administrator'], type: 'PERMS', permission: true }],
    guild: ['1128307451066855515', '1122995611621392424'],
    options: [
      {
        name: 'datum',
        description: 'Od jakého data chceš tréninky brát?',
        type: 3,
        required: false
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

      let time = new Date (interaction.options.getString('datum') || `1. 1. 2023`)

      let team = await edge.get('general', 'clubs').then(n => n.find(a => a.server?.guild === interaction.guild.id))
      if (!team) return interaction.editReply({ content: 'Použij příkaz na podporovaném discord serveru!'})

      let data = await edge.get(`teams`, team.server.database, {}).then(n => n.filter(a => a.ended == true && new Date (a.start.dateTime).getTime() > time.getTime() && a.type == 'trenink'))

      let verify = await edge.get('general', 'users', {})

      let total = data.length
      let desc = []

      for (let trenink of data) {
        for (let option of trenink.answers.split('|')) {
          trenink[option].forEach(a => {
            let user = desc.find(b => b.id == a)
            if (!user) {
              let name = verify.find(n => n._id == a)?.name || dc_client.users.get(a) || `<@${a}>`
              desc.push({id: a, name: name, Přijdu: 0, Nepřijdu: 0, 'Přijdu pozdě': 0})
              user = desc.find(b => b.id == a)
            }
            user[option] += 1
          })
        }
      }
      
      desc = desc.sort((a, b) => b.Přijdu - a.Přijdu).map(n => `**${n.name}:** Přijdu - ${n.Přijdu}, Nepřijdu - ${n.Nepřijdu}, Přijdu pozdě - ${n[`Přijdu pozdě`]}, Total: ${n.Přijdu + n.Nepřijdu + n[`Přijdu pozdě`]}/${total}`).join('\n')
      
      
      await interaction.editReply({ embeds: [{ title: 'Data:', description: `${desc}`, color: 2982048}], ephemeral: edge.isEphemeral(interaction)})
      

    },
}
