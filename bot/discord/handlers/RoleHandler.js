
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
        let nickname = user.name + (team?.short ? ` #${team.short}` : '')
        if (member.nickname !== nickname) try { await member.setNickname(nickname) } catch (e) { if (member.user.username !== "davidczpdy") console.error('Nemám práva na změnu jména -> ' + nickname) }
      } else try { await member.setNickname(null) } catch (e) { if (member.user.username !== "davidczpdy") console.error('Nemám práva na změnu jména -> ' + nickname) }

      /* Splits */
      let splits = Object.keys(this.config.roles).filter(n => n.startsWith('split_')).map(n => n.split('_')[1])

      for (let key of splits) {
        let cat = Object.keys(this.config.roles).filter(n => n.startsWith(`${key}_`)).map(n => this.config.roles[n])

        if (member._roles.some(n => cat.includes(n))) await this.roleAdd(member, this.roles.get(this.config.roles[`split_${key}`]))
        else await this.roleRemove(member, this.roles.get(this.config.roles[`split_${key}`]))

      }
    }

  }

  async updateClubs(filter = [/*'1128307451066855515'*/]) {

    let users = await this.edge.get('general', 'users', {})
    let teams = await this.edge.get('general', 'clubs', {})
    this.teams = teams

    teams = teams.filter(n => n.server)
    if (filter.length) teams = teams.filter(n => filter.includes(n.id))

    for (let team of teams) {
      let guild = dc_client.guilds.cache.get(team.server.guild)
      if (!guild) {console.error(`Bot není na ${team.name} DC!`);continue;}
/*
      let con = {
        changeName: true,

        splitRole: true,
        memberRole: true,
        trainerRole: true
      }
      if (!team.server.config) team.server.config = con
      await this.edge.post('general', 'clubs', team)
*/
      let config = team.server.config


      let members = await guild.members.fetch()

      for (let member of members) {

        let user = users.find(n => n._id == member.user.id)

        /* Change Name */
        if (config.changeName) {
          let nickname = user?.name || null
          if (member.nickname !== nickname) try { await member.setNickname(nickname) } catch (e) { if (member.user.username !== "davidczpdy") console.error('Nemám práva na změnu jména -> ' + nickname||member.user.username) }
        }

        /* Member & Trainer role */
        if (config.memberRole) {
          let memberRole = guild.roles.cache.get(team.server.roles?.member||'123456789')
          if (memberRole && user?.team && user?.team == team.server.roles.member) await this.roleAdd(member, role);
          else if (memberRole) await this.roleRemove(member, role);
        }
        if (config.trainerRole) {
          let trainers = await this.edge.get('general', 'treneri', {_id: 'list'}).then(n => n[0])
          let trainerRole = guild.roles.cache.get(team.server.roles?.trener||'123456789')
          if (trainerRole && user?.team && user?.team == team.server.roles.member && trainers?.list?.includes(member.user.id)) await this.roleAdd(member, role);
          else if (trainerRole) await this.roleRemove(member, role);
        }

        /* Split Roles */
        if (config.splitRole) {
          let splitRoles = guild.roles.cache.filter(n => n.name.includes('▬▬'))
          /* GET ROLES BY POSITION */
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
