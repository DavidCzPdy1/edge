
class MessageHandler {
  constructor(discord) {
    this.edge = discord.edge
    this.discord = discord
    this.config = this.edge.config.discord
  }

  async onMessage(message) {
    if (message.author.id == global.config.discord.clientID) return
    if (message.channel.type === 1) global.channels?.log?.send({ embeds: [{ title: `${message.author.username}'s dm` , description: message.content}]})


    if (message.content.startsWith(this.config.prefix)) this.runCommand(message)
  }

  async runCommand(message) {
    let commands = this.edge.commands.filter(n => n.type?.includes('message'))

    let args = message.content.replace(this.config.prefix, '').split(' ').filter(n => n).map(n => n.trim())
    let cmd = commands.get(args[0].toLowerCase()) || commands.get(this.edge.aliases.get(args[0].toLowerCase()))
    if (!cmd) return

    let reply;

    let perms = this.edge.handlePerms(cmd.permissions, message)
    if (!perms) reply = `${message.member.nickname || message.author.username} nemá oprávnění na \`${cmd.name}\` příkaz!`
    else if (cmd.platform === 'dc') reply = await cmd?.run(this.edge, message, message.content.replace(this.config.prefix, '').replace(args[0], '').trim()).catch(async (e) => message.reply({ embeds: [await console.error(e)], failIfNotExists: false }));
    
    console.discord(`${cmd.name} was requested by <@${message.author.id}>`)

    if (!reply) return

    
    //console.discord(typeof reply === 'string' ? reply : reply.msg)
    let dcreply = { failIfNotExists: false }
    if (typeof reply === 'string') dcreply.content = reply
    else if (reply.embed) dcreply.embeds = [reply.embed]
    else if (reply.msg) dcreply.content = reply.msg

    message.reply(dcreply)
    

  }
}

module.exports = MessageHandler
