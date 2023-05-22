
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

    let members = await guild.members.fetch();
  
    for (let id of Object.keys(this.config.roles).filter(n => n.startsWith('club_')).map(n => this.config.roles[n])) {
        let role = guild.roles.cache.get(id)
        if (!role) { console.error('Nebyla nalezena club role s ID ' + id ); continue; }

        let data = {
            _id: id,
            name: role.name,
            color: role.color,
            users: role.members.map(n => n.id),
            trainers: role.members.filter(n => n._roles.includes(this.config.roles.position_trener)).map(n => n.id)
        }

        await edge.post('general', 'clubs', data)    
    }
  }

  async updateRoles (ids = []) {
    let guild = dc_client.guilds.cache.get('1105413744902811688')
    this.guild = guild

    let members = await guild.members.fetch();

    if (ids.length) members = members.filter(n => ids.includes(n.user.id))
    
    let trainer = await this.edge.get('general', 'clubs', {_id: 'list'}).then(n => n[0])
    let users = await this.edge.get('general', 'users', {})

    for (let member of members) {
      member = member[1]

      if (member.user.bot) continue

      let user = users.find(n => n._id == member.user.id)

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
      let club = Object.keys(this.config.roles).filter(n => n.startsWith('club_')).map(n => this.config.roles[n])
      for (let key of club) {
        if (!user || user.team !== key) await this.roleRemove(member, this.roles.get(key))
        else if (user && user.team == key) await this.roleAdd(member, this.roles.get(key))
      }

      if (user) {
        let nickname = user.name
        if (member.nickname !== nickname) try { await member.setNickname(nickname)} catch (e) {console.error('Nemám práva na změnu jména -> '+nickname)}

      }

      /* Splits */
      let splits = Object.keys(this.config.roles).filter(n => n.startsWith('split_')).map(n => n.split('_')[1])
      
      for (let key of splits) {
        let cat = Object.keys(this.config.roles).filter(n => n.startsWith(`${key}_`)).map(n => this.config.roles[n])

        if (member._roles.some(n => cat.includes(n))) await this.roleAdd(member, this.roles.get(this.config.roles[`split_${key}`]))
        else await this.roleRemove(member, this.roles.get(this.config.roles[`split_${key}`]))

      }
    }

    this.updateClubDb()
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

    /*
    let role = {}
    role.club = this.config.clubRoles.map(id => roles.get(id))
    role.position = this.config.positionRoles.map(id => roles.get(id))
    role.mention = this.config.mentionRoles.map(id => roles.get(id))
    role.split = this.config.splitRoles.map(id => roles.get(id))
*/
    this.roles = roles
  }

}

module.exports = RoleHandler
