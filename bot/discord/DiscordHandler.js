
const { Client, Collection, GatewayIntentBits, Partials, Message, VoiceChannel } = require('discord.js');
const path = require('node:path');
const fs = require('fs');

const MessageHandler = require('./handlers/MessageHandler');
const RoleHandler = require('./handlers/RoleHandler');
const VoiceHandler = require('./handlers/VoiceHandler');

class DiscordHandler {
  constructor(edge) {

    this.edge = edge

    this.messageHandler = new MessageHandler(this)
    this.roles = new RoleHandler(this)
    this.voice = new VoiceHandler(this)
  }

  async init() {
    
    global.dc_client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildVoiceStates],
      partials: [Partials.Channel, Partials.GuildMember],
      allowedMentions: { parse: [] }
    });

    this.client = dc_client

    this.client.on('messageCreate', message => this.messageHandler.onMessage(message))
    
    this.client.login(this.edge.config.dev ? process.env.token : process.env.token ).catch(e => {console.error(e)})

    const events = fs.readdirSync(path.join(__dirname, './events')).filter((file) => file.endsWith(".js"));
    let eventsCount = events.length
    for (const file of events) {
      try {
          const event = require(`./events/${file}`)
          this.client.on( file.split(".")[0], event.bind(null, this.edge));
      } catch (e) {
          console.error(e)
          eventsCount -= 1
      }
    }
    console.discord(`${eventsCount}/${events.length} Events Loaded`)
  } 

}

module.exports = DiscordHandler