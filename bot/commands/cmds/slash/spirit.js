
module.exports = {
  name: 'spirit',
  description: 'Spirit command!',
  permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}, { id: '533684732970532876', type: 'USER', permission: true},],
  options: [
    {
      name: 'action',
      description: 'Co mám udělat?',
      type: 3,
      required: true,
      choices: [
        { value: 'results', name: 'Zobrazit existující turnaj' },
        { value: 'create', name: 'Vytvořit nový turnaj - usage "name:id"' },
        { value: 'teaminfo', name: 'Jak si vede tvůj tým?' },
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

    let table = await edge.google.getTable(edge.google.spiritIds[0]).then(n => n.find(a => a.properties.sheetId == id || a.properties.title == id)?.properties || n[3]?.properties)
    if (!table) return interaction.editReply({ embeds: [{ title: 'ERROR v najití default jména a ID tabulky', color: 15548997 }]})

    if (action == 'results') {
      let eventId = table.sheetId
      let eventName = table.title

      let spirit = await calculateTourney(edge.google, ids, eventId, eventName)
      console.log(spirit)

      let embed = {
        title: `Spirit skóre s názvem "${eventName}"`,
        color: 4164908,
        description: Object.values(spirit.total).sort((a, b) => b.avg - a.avg).map((n, i) => `\`#${i+1}\` ${n.name} \`${n.avg}\``).join('\n')
      }


      if (spirit.errors.length) embed.description = embed.description + `\n\nNezapočítané tabulky:\n${errors.join('\n')}`
      interaction.editReply({ embeds: [embed] })

      return
    }


    interaction.editReply({ content: 'Not developed yet!'})
  },
  autocomplete: async (edge, interaction) => {
    let focused = interaction.options.getFocused()

    let show = await edge.google.getTable(edge.google.spiritIds[0]).then(n => n.map(a => ( { name: a.properties.title, value:String(a.properties.sheetId)||a.properties.title } )))
    show.shift()
    show.shift()
    show.shift()
    
    let z = show.filter(n => n.name.toLowerCase().includes(focused.toLowerCase()) || String(n.value).includes(focused)).slice(0, 25)
    return interaction.respond(z.length ? z : [{ value: (focused.trim()?.length > 2 ? focused.trim() : 'Chybné užití'), name: 'Nový turnaj: ' + focused.trim()}])
  }
}



async function createTourney(google, ids, eventId, eventName) {

  let success = 0;
  let errors = [];
  for (let sheetId of ids) {

    try {
      let template = await google.getTable(sheetId).then(a => a.find(n => n.properties.title == 'TEMPLATE')?.properties)
      let data = {
        index: template.index+1,
        id: eventId,
        name: eventName,
        source: template.sheetId
      }
      await google.duplicateTable(sheetId, data)

      success ++
    } catch (e) {errors.push(sheetId) }
  }
  return {success: success, errors: errors}

}

async function calculateTourney(google, ids, eventId, eventName) {
  let spirit = { total: {}, teams: [], errors: []}
  for (let sheetId of ids) {
    try {
      let tableName = await google.getTable(sheetId).then(n => n.find(a => a.properties.sheetId == eventId || a.properties.title == eventName)?.properties.title)

      if (!tableName) {
        errors.push(`\`${sheetId}\` - nemá tabulku`)
        continue;
      }


      let results = await google.getTableData(sheetId, tableName)
  
      results.shift()
      results.shift()
  
      results.forEach(e => {
        a1 = e.slice(0, 8)
        a2 = e.slice(8, 16)
        if (a1[1] !== '-----' && Number(a1[7])) spirit.teams.push({name: a1[1], total: Number(a1[7])})
        if (a2[1] !== '-----' && Number(a2[7])) spirit.teams.push({name: a2[1], total: Number(a2[7])})
      })
    } catch (e) {errors.push(sheetId)}
  }


  for (let hodnoceni of spirit.teams) {
    let tym = spirit.total[hodnoceni.name] || {name: hodnoceni.name, points: 0, games: 0, avg: 0}

    tym.points = tym.points + hodnoceni.total
    tym.games ++
    tym.avg = tym.points/tym.games

    spirit.total[hodnoceni.name] = tym
  }


  return spirit
}