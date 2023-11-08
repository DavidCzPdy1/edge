
const { ActionRowBuilder, ButtonBuilder } = require('discord.js')
const fs = require('fs');
const path = require('node:path');


const getSpiritData = (arr) => arr.slice(2, 8).map(a => Number(a) || 0)
const countSpirit = (arr, add) => arr.map((a, i) => a+(add[i]))


module.exports = {
  name: 'spirit',
  description: 'Spirit command!',
  permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}, { id: '533684732970532876', type: 'USER', permission: true}, { id: '1105544649080320110', type: 'ROLE', permission: true}],
  options: [
    {
      name: 'action',
      description: 'Co mám udělat?',
      type: 3,
      required: true,
      choices: [
        { value: 'teaminfo', name: 'Jak si vede můj tým? (team)' },
        { value: 'results', name: 'Zobrazit existující turnaj (EDGE)' },
        { value: 'create', name: 'Vytvořit nový turnaj - usage "name:id" (EDGE)' },
        { value: 'refreshIds', name: 'Aktualizovat IDS (dev)' },
      ]
    },
    {
      name: 'name',
      description: 'Jaký turnaj chceš vytvořit/vidět?',
      type: 3,
      required: false,
      autocomplete: true
    },
  ],
  type: 'slash',
  platform: 'discord',
  run: async (edge, interaction) => {
    await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

    let action = interaction.options.getString('action')

    let perms = edge.handlePerms([{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}, { id: '533684732970532876', type: 'USER', permission: true}], interaction)
    if (action !== 'teaminfo' && !perms) return interaction.editReply({ embeds: [{ title: 'ERROR!', description: 'Nemáš potřebné oprávnění!', color: 15548997 }]})

    if (action == 'refreshIds') {
      let spiritIds = await edge.get('login', 'google', {_id: 'spiritIds'}).then(n => n[0].value)
      edge.google.spiritIds = spiritIds
      return interaction.editReply({ embeds: [{ title: `Cached total ${spiritIds.length} id${spiritIds.length == 0 || spiritIds.length > 1 ? 's' : ''}!`, description: spiritIds.join('\n'), color: 2067276 }] })
    }


    let id = interaction.options.getString('name')
    let ids = edge.google.spiritIds

    if (action == 'create' && (!id || !Number(id?.split(':')[1]))) return interaction.editReply({ embeds: [{ title: 'ERROR ve vytváření nového spirita', description: id ? `Zadání \`${id}\` musí obsahovat i číselné ID (name:id)` : `Pro vytvoření spirita musíš zadat jméno!`, color: 15548997 }]})
    else if (action == 'create') {
      let eventName = id.split(':')[0]
      let eventId = Number(id.split(':')[1])

      let res = await createTourney(edge.google, ids, eventId, eventName)

      return interaction.editReply({ embeds: [{ title: `Created new spirit table!`, description: `**Name:** ${eventName}\n**Id:**${eventId}\n**Rate:** ${res.success}/${res.success + res.errors.length}\n\n${res.errors.length ? ('**Errors:**\n' + res.errors.join(', ')) : ''}` }] })
    }

    let table = await edge.google.getTable(edge.google.spiritIds[0]).then(n => n.sheets.find(a => a.properties.sheetId == id || a.properties.title == id)?.properties || n.sheets[3]?.properties)
    if (!table) return interaction.editReply({ embeds: [{ title: 'ERROR v najití default jména a ID tabulky', color: 15548997 }]})

    let eventId = table.sheetId
    let eventName = table.title

    let spirit = await calculateTourney(edge.google, ids, eventId, eventName)

    if (action == 'results') {
      let embed = {
        title: `Spirit skóre s názvem "${eventName}"`,
        color: 4164908,
        description: Object.values(spirit.total).sort((a, b) => b.avg - a.avg).map((n, i) => `\`#${i+1}\` ${n.name} \`${f(n.avg, 3)} points\``).join('\n')
      }


      if (spirit.errors.length) embed.description = embed.description + `\n\nNezapočítané tabulky:\n${spirit.errors.join('\n')}`
      interaction.editReply({ embeds: [embed] })

      return
    }

    if (action == 'teaminfo') {

      let teams = (edge.discord.roles.teams || await edge.get('general', 'clubs', {})).map(n => n.id)
      let id = interaction.member._roles.find(n => teams.includes(n))
      if (!id) return interaction.editReply({ embeds: [{ title: 'ERROR', description: 'Nemáš roli žádného týmu!', color: 15548997 }]}) 
      let team = interaction.guild.roles.cache.get(id)?.name
      if (!team) return interaction.editReply({ embeds: [{ title: 'ERROR', description: 'Nenašel jsem danou týmovou roli!', color: 15548997 }]}) 

      let teamsFormatted = Object.keys(spirit.total).filter(n => n.toLowerCase().includes(team.toLowerCase()) || team.toLocaleLowerCase().split(' ').some(a => n.toLocaleLowerCase().includes(a)))
      if (!teamsFormatted.length) return interaction.editReply({ embeds: [{ title: 'ERROR', description: 'Nedokázal jsem si propojit discord roli s týmem ve spirit tabulce!', color: 15548997 }]}) 

      let recieved = Object.values(spirit.total).filter(a => teamsFormatted.includes(a.name)).map((n, i) => `${n.name} - ${n.raw.map(a => f(a/n.games, 3)).join(' | ')} `).join('\n') || 'Žádné spirit data :/'
      let given = []
      teamsFormatted.forEach(teamFormatted => {
        given.push(teamFormatted + ' - ' + [0, 0, 0, 0, 0, 0].map((m, i) => f(spirit.teams.filter(a => teamFormatted.includes(a.by)).map(n => n.rawData[i]).reduce((a, b) => a+b, 0)/(spirit.teams.filter(a => teamFormatted.includes(a.by)).length||1), 3)).join(' | '))
      })
      
      let embed = {
        title: `Spirit skóre s názvem "${eventName}" týmu ${team}`,
        color: interaction.guild.roles.cache.get(id)?.color || 4164908,
        description: `**Obdržené body:**\n${recieved}\n\n**Udělené body:**\n${given.join('\n')}`
      }

      let components = teamsFormatted.map(n => new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`spirit_cmd_getTeamData_${eventName}_${n}`).setStyle(2).setLabel(n)))
      interaction.editReply({ embeds: [embed], components: components })
      return
    }


    interaction.editReply({ content: 'Not developed yet!'})
  },
  autocomplete: async (edge, interaction) => {
    let focused = interaction.options.getFocused()

    let show = await edge.google.getTable(edge.google.spiritIds[0]).then(n => n.sheets.map(a => ( { name: a.properties.title, value:String(a.properties.sheetId)||a.properties.title } )))
    show.shift()
    show.shift()
    show.shift()
    
    let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase()) || String(n.value).includes(focused)).slice(0, 25)
    return interaction.respond(z.length ? z : [{ value: (focused.trim()?.length > 2 ? focused.trim() : 'Chybné užití'), name: 'Nový turnaj: ' + focused.trim()}])
  },
  getTeamData: async (edge, interaction) => {
    let args = interaction.customId.split('_')
    let eventName = args[3]
    let teamName = args[4]

    await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })

    let spirit = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../spirit.json'), 'utf8'))[eventName]
    if (!spirit) return interaction.editReply({ embeds: [{ title: 'ERROR', description: 'Nenašel jsem uloženou tabulku!', color: 15548997 }]}) 

    let recieved = spirit.teams.filter(n => n.name == teamName).map(n => `${n.by} - ${n.rawData.join(' | ')}`)
    
    let embed = {
      title: `Spirit skóre s názvem "${eventName}" týmu ${teamName}`,
      color: interaction.message.embeds[0]?.color || 4164908,
      description: `**Obdržené body:**\n${recieved.join('\n')}`
    }

    interaction.editReply({ embeds: [embed] })

  }
}



async function createTourney(google, ids, eventId, eventName) {

  let success = 0;
  let errors = [];
  for (let sheetId of ids) {

    /*
    try {
      let template = await google.getTable(sheetId).then(a => a.sheets.find(n => n.properties.title == 'TEMPLATE')?.properties)
      let data = {
        index: template.index+1,
        id: eventId,
        name: eventName,
        source: template.sheetId
      }
      await google.duplicateTable(sheetId, data)

      success ++
    } catch (e) {errors.push(sheetId) }
    */

    try {
      let data = {
        index: 3,
        id: eventId,
        name: eventName,
      }
      await google.copyTo(google.spiritMaster, 322683186, sheetId, data)
      
      success ++
    } catch (e) {
      errors.push(sheetId)
    }
  }
  return {success: success, errors: errors}

}

async function calculateTourney(google, ids, eventId, eventName) {
  let spirit = { total: {}, teams: [], errors: []}

  let getFromCache = ['10.6.2023', '21-22.10.2023']

  if (getFromCache.includes(eventName)) {
    let file = fs.readdirSync(path.join(__dirname, '../../')).filter(n => n == 'spirit.json').length
    if (file) {
      file = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../spirit.json'), 'utf8'))
      if (file[eventName]) return file[eventName]
    }
  }


  for (let sheetId of ids) {
    try {
      let table = await google.getTable(sheetId)
      let tym = table.properties.title
      if (!tym) tym = sheetId
      let tableName = table.sheets.find(a => a.properties.sheetId == eventId || a.properties.title == eventName)?.properties.title

      if (!tableName) {
        spirit.errors.push(`\`${tym||sheetId}\` - nemá tabulku se jménem`)
        continue;
      }


      let results = await google.getTableData(sheetId, tableName)
  
      results.shift()
      results.shift()
  
      results.forEach(e => {
        a1 = e.slice(0, 8)
        a2 = e.slice(8, 16)
        if (a1[1] !== '-----' && Number(a1[7])) spirit.teams.push({name: a1[1], total: Number(a1[7]), by: tym, rawData: getSpiritData(a1)})
        if (a2.length > 6 && a2[1] !== '-----' && Number(a2[7])) spirit.teams.push({name: a2[1], total: Number(a2[7]), by: tym, rawData: getSpiritData(a2)})
      })
    } catch (e) {spirit.errors.push(sheetId)}
  }


  for (let hodnoceni of spirit.teams) {
    let tym = spirit.total[hodnoceni.name] || {name: hodnoceni.name, points: 0, games: 0, avg: 0, raw: [0, 0, 0, 0, 0, 0]}

    tym.points = tym.points + hodnoceni.total
    tym.games ++
    tym.avg = tym.points/tym.games
    tym.raw = countSpirit(tym.raw, hodnoceni.rawData)

    spirit.total[hodnoceni.name] = tym
  }

  let file = fs.readdirSync(path.join(__dirname, '../../')).filter(n => n == 'spirit.json').length
  if (!file) { fs.writeFile(path.join(__dirname, '../../spirit.json'),  JSON.stringify({}, null, 4), 'utf-8', data => {}); await delay(800) }
  file = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../spirit.json'), 'utf8'))

  file[eventName] = spirit
  fs.writeFile(path.resolve(__dirname, '../../spirit.json'), JSON.stringify(file, null, 4), 'utf8', data =>{})

  return spirit
}