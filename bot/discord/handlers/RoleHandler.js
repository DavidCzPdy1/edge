
class RoleHandler {
  constructor(discord) {
    this.edge = discord.edge
    this.discord = discord
    this.config = this.edge.config.discord

    
    this.positionRoles = this.config.positionRoles
    this.mentionRoles = this.config.mentionRoles

  }

  async updateClubDb() {
    let guild = dc_client.guilds.cache.get('1105413744902811688')
    if (!guild) return console.error('Bot není na EDGE DC')
    this.guild = guild

    let members = await guild.members.fetch();
  
    for (let id of this.config.clubRoles) {
        let role = guild.roles.cache.get(id)
        if (!role) { console.error('Nebyla nalezena club role s ID ' + id ); continue; }

        let data = {
            _id: id,
            name: role.name,
            color: role.color,
            users: role.members.map(n => n.id),
            trainers: [],
            banned: []
        }

        await edge.post('general', 'clubs', data)    
    }
  }

  async updateRoles () {
    let guild = dc_client.guilds.cache.get('1105413744902811688')
    this.guild = guild

    let members = await guild.members.fetch();
    
    let trainer = await this.edge.get('general', 'clubs', {_id: 'list'}).then(n => n[0])

    for (let member of members) {
      member = member[1]

      if (member.user.bot) continue

      /* EDGE VEDENÍ */
      if (trainer.leaders.includes(member.id)) await this.roleAdd(member, this.roles.get(this.config.positionRoles[0]))
      else await this.roleRemove(member, this.roles.get(this.config.positionRoles[0]))

      /* Trainer Role */
      if (trainer.list.includes(member.id)) await this.roleAdd(member, this.roles.get(this.config.positionRoles[1]))
      else await this.roleRemove(member, this.roles.get(this.config.positionRoles[1]))

      /* Member Role */
      await this.roleAdd(member, this.roles.get(this.config.positionRoles[2]))

      /* Splits */
      if (member._roles.some(n => this.config.positionRoles.includes(n))) await this.roleAdd(member, this.roles.get(this.config.splitRoles[0]))
      else await this.roleRemove(member, this.roles.get(this.config.splitRoles[0]))

      if (member._roles.some(n => this.config.clubRoles.includes(n))) await this.roleAdd(member, this.roles.get(this.config.splitRoles[1]))
      else await this.roleRemove(member, this.roles.get(this.config.splitRoles[1]))

      if (member._roles.some(n => this.config.mentionRoles.includes(n))) await this.roleAdd(member, this.roles.get(this.config.splitRoles[2]))
      else await this.roleRemove(member, this.roles.get(this.config.splitRoles[2]))
    }

    this.updateClubDb()
  }

  async roleAdd(member, role) {
    if (!member._roles.includes(role.id)) await member.roles.add(role)
  }

  async roleRemove(member, role) {
    if (member._roles.includes(role.id)) await member.roles.remove(role)
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
