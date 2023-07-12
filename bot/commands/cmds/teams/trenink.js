
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js')

const updateDesc = (embed, desc) => { embed.description = desc; return embed }

module.exports = {
    name: 'trenink',
    description: 'Creates new question!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1128308482160996453', type: 'ROLE', permission: true}],
    guild: ['1128307451066855515'],
    options: [
      {
        name: 'tym',
        description: 'Jaký chceš zvolit tým?',
        type: 3,
        required: false,
        choices: [
          { value: 'rakety', name: 'Rakety Žižkoff' },
          { value: 'podebrady', name: 'Micropachycephalosauři' },
        ]
      },
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
      await interaction.deferReply({ ephemeral: true })

      let time = new Date (interaction.options.getString('datum') || `1. 1. 2023`)

      let data = await edge.get(interaction.options.getString('tym') || `rakety`, 'treninky', {}).then(n => n.filter(a => /*a.ended == true &&*/ new Date (a.start.dateTime).getTime() > time.getTime()))

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
      
      
      await interaction.editReply({ embeds: [{ title: 'Data:', description: `${desc}`, color: 2982048}], ephemeral: true})
      

    },
}

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