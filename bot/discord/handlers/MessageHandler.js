
class MessageHandler {
  constructor(discord) {
    this.edge = discord.edge
    this.discord = discord
    this.config = this.edge.config.discord
  }

  async onMessage(message) {

    //if (message.channel.id == '1105918656203980870') await dc_client.channels.cache.get('1105917930610368614')?.send({ content: message.content, embeds: message.embeds, allowedMentions: { parse: []} })

    if (message.author.id == global.config.discord.clientID) return
    if (message.channel.type === 1) {
      try {
        //await dc_client.channels.cache.get('1141101587876552894')?.send({ embeds: [{ title: `${message.author.username}'s dm` , description: message.content}]})
        let webhook = await dc_client.channels.cache.get('1141101587876552894').fetchWebhooks().then(a => a.first())
        //if (webhook.name !== message.author.name || webhook.avatar !== message.author.avatar) await webhook.edit({ name: message.author.username, avatar: message.author.avatar, })
        await webhook.send({
          content: message.content,
          username: message.author.username,
          avatarURL: message.author.avatarURL(),
          files: message.attachments.map(n => n.attachment)
        });
      } catch (e) { console.error(e)}
    } else if (message.channel.id == '1141101587876552894' && message.reference) {
      let msg = await dc_client.channels.cache.get('1141101587876552894')?.messages.fetch(message.reference.messageId)
      let user = dc_client.users.cache.find(n => n.username == msg.author.username)
      if (user) await user?.send({ content: message.content, files: message.attachments.map(n => n.attachment)}).then(a => message.react('✅'))
    }


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
    
    if (message.author.id !== '378928808989949964') console.discord(`${cmd.name} was requested by <@${message.author.id}>`)

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
