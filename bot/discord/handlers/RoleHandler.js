
class RoleHandler {
  constructor(discord) {
    this.edge = discord.edge
    this.discord = discord
    this.config = this.edge.config.discord
  }

  async updateClubDb() {
    let guild = dc_client.guilds.cache.get('1105413744902811688')
    if (!guild) return console.error('Bot není na EDGE DC')
    this.guild = guild

    let data = await this.edge.get('general', 'clubs', {})

    for (let club of data) {

      let role = guild.roles.cache.get(club.id) || guild.roles.cache.find(n => n.name == club.name)
      if (!role) {
        role = await guild.roles.create({
          name: club.name,
          color: club.color || 17575,
          position: (guild.roles.cache.get('1108826744573661204')?.rawPosition || 0) + 1
        })
      }
      
      if (role.name !== club.name || role.id !== club.id || role.color !== club.color) await this.edge.post('general', 'clubs', {_id: club._id, color: role.color, name: role.name, id: role.id})
    }

  }

  async updateRoles(ids = []) {
    let guild = dc_client.guilds.cache.get('1105413744902811688')
    this.guild = guild

    let members = await guild.members.fetch();

    if (ids.length) members = members.filter(n => ids.includes(n.user.id))

    await this.updateClubDb()

    let trainer = await this.edge.get('general', 'treneri', { _id: 'list' }).then(n => n[0])
    let users = await this.edge.get('general', 'users', {})
    let teams = await this.edge.get('general', 'clubs', {})
    this.teams = teams

    for (let member of members) {
      member = member[1]

      if (member.user.bot) continue

      let user = users.find(n => n._id == member.user.id)
      let team = teams.find(n => n.id == user?.team)
      

      /* EDGE VEDENÍ */
      if (trainer.leaders.includes(member.id)) await this.roleAdd(member, this.roles.get(this.config.roles.position_edge))
      else await this.roleRemove(member, this.roles.get(this.config.roles.position_edge))

      /* Trainer Role */
      if (trainer.list.includes(member.id)) await this.roleAdd(member, this.roles.get(this.config.roles.position_trener))
      else await this.roleRemove(member, this.roles.get(this.config.roles.position_trener))

      /* Member Role */
      if (user) await this.roleAdd(member, this.roles.get(this.config.roles.position_member))
      else await this.roleRemove(member, this.roles.get(this.config.roles.position_member))

      /* Club Roles */
      let club = teams.map(n => n.id)
      for (let key of club) {
        if (!user || user.team !== key) await this.roleRemove(member, this.roles.get(key))
        else if (user && user.team == key) await this.roleAdd(member, this.roles.get(key))
      }

      if (user) {
        let nickname = user.name + (team?.name ? ` #${team.name?.slice(0, 3)?.toUpperCase()}` : '') //(team?.short ? ` #${team.short}` : '')
        if (member.nickname !== nickname) try { await member.setNickname(nickname) } catch (e) { if (member.user.username !== "davidczpdy") console.error('Nemám práva na změnu jména -> ' + nickname) }
      } else try { await member.setNickname(null) } catch (e) { if (member.user.username !== "davidczpdy") console.error('Nemám práva na změnu jména -> ' + nickname) }

      /* Splits */
      let splitRoles = guild.roles.cache.filter(n => n.name.includes('▬▬')).map(n => n).sort((a, b) => b.position - a.position)
      let positions = splitRoles.map(n => n.position)
      for (let i = 0; i < splitRoles.length; i++) {
        let splitRole = splitRoles[i]

        let hasRole = member.roles.cache.filter(a => a.position < positions[i] && a.position > (positions[i+1] || 0))
        if (hasRole.size) await this.roleAdd(member, splitRole)
        else await this.roleRemove(member, splitRole)
      }
    }

    await this.updateClubs()

  }

  async updateClubs(filter = [/*'1108825861190340720'*/]) {

    let users = await this.edge.get('general', 'users', {})
    let teams = await this.edge.get('general', 'clubs', {})
    this.teams = teams

    teams = teams.filter(n => n.server)
    if (filter.length) teams = teams.filter(n => filter.includes(n.id) || filter.includes(n.server?.guild))

    for (let team of teams) {
      let guild = dc_client.guilds.cache.get(team.server.guild)
      if (!guild) {console.error(`Bot není na ${team.name} DC!`);continue;}

      let con = {
        changeName: false,

        splitRole: false,
        trainerRole: false,
        treninky: false,
        turnaje: false,
        buttons: false
      }

      team.server.config = edge.mergeSettings(con, team.server.config || {})
      await this.edge.post('general', 'clubs', team)
      
      let config = team.server.config

      let db = await edge.get('teams', team.server.database, {})

      let members = await guild.members.fetch()

      for (let member of members) {
        member = member[1]
        if (member.user.bot) continue

        let user = users.find(n => n._id == member.user.id)

        /* Change Name */
        if (config.changeName) {
          let nickname = user?.name || null
          if (member.nickname !== nickname) try { await member.setNickname(nickname) } catch (e) { if (member.user.username !== "davidczpdy") console.error('Nemám práva na změnu jména -> ' + nickname||member.user.username) }
        }

        /* Trainer role */
        if (config.trainerRole && team.server.roles?.trener) {
          let trainers = await this.edge.get('general', 'treneri', {_id: 'list'}).then(n => n[0])
          let trainerRole = guild.roles.cache.get(team.server.roles?.trener)
          if (trainerRole && user?.team && user?.team == team.id && trainers?.list?.includes(member.user.id)) await this.roleAdd(member, trainerRole);
          else if (trainerRole && !user?.clubs?.find(n => n.id == team._id)?.bonus?.includes(trainerRole.id)) await this.roleRemove(member, trainerRole);
        }


        /* Split Roles */
        if (config.splitRole) {
          let splitRoles = guild.roles.cache.filter(n => n.name.includes('▬▬')).map(n => n)
          let positions = splitRoles.map(n => n.position)
          for (let i = 0; i < splitRoles.length; i++) {
            let splitRole = splitRoles[i]
    
            let hasRole = member.roles.cache.filter(a => a.position < positions[i] && a.position > (positions[i+1] || 0))
            if (hasRole.size) await this.roleAdd(member, splitRole)
            else await this.roleRemove(member, splitRole)
          }
        }

        /* Turnaj */
        if (config.turnaje) {
          for (let turnaj of db.filter(n => n.type == 'turnaj' && !n.ended)) {
            if (!turnaj.role) continue
            let role = guild.roles.cache.get(turnaj.role)
            if (!role) {
              let splits = ['mention', 'ping', 'oznámení']
              let pos = guild.roles.cache.find(n => splits.some(a => n.name.toLowerCase().includes(a)))?.position || 1
              role = await guild.roles.create({ name: `${turnaj.name}`, color: team.color, reason: 'Na komunikaci lidí, co jedou na turnaj! - FIX', position: pos })
              turnaj.role = role.id
              await edge.post('teams', team.server.database, turnaj)
            }
            if (turnaj.Pojedu.includes(member.user.id)) this.roleAdd(member, role)
            else if (turnaj['Uvidím'].includes(member.user.id)) this.roleAdd(member, role)
            else this.roleRemove(member, role)
          }
        }

        /* New verify SYSTEM */
        if (config.buttons && team.server.buttons) {
          let clubVerify = user?.clubs?.find(n => n.id == team._id)
          let allRoles = team.server.buttons.map(n => n.roles).flat(1)

          for (let id of allRoles) {
            let role = guild.roles.cache.get(id)
            if (role && clubVerify?.roles?.includes(id)) this.roleAdd(member, role)
            else if (role && !clubVerify?.roles?.includes(id)) this.roleRemove(member, role)
          }
          let bonusRoles = clubVerify?.bonus || []
          for (let id of bonusRoles) {
            let role = guild.roles.cache.get(id)
            if (role) this.roleAdd(member, role)
          }
        }

      }
    }

  }

  async roleAdd(member, role) {
    if (!member._roles.includes(role.id)) await member.roles.add(role)
  }

  async roleRemove(member, role) {
    if (member._roles.includes(role.id)) await member.roles.remove(role)
  }

  async roleToggle(member, role) {
    if (!member._roles.includes(role.id)) {
      await member.roles.add(role)
      return true
    }
    else {
      await member.roles.remove(role)
      return false
    }
  }

  async init() {
    let guild = dc_client.guilds.cache.get('1105413744902811688')
    if (!guild) return console.error('Bot není na EDGE DC - INIT event')
    this.guild = guild

    let roles = await guild.roles.fetch();

    this.roles = roles
  }

}

module.exports = RoleHandler
