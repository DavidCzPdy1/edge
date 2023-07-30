
const { Client, Collection, GatewayIntentBits, Partials, Message, VoiceChannel } = require('discord.js');
const { Player } = require('discord-player');
const path = require('node:path');
const fs = require('fs');

const MessageHandler = require('./handlers/MessageHandler');
const RoleHandler = require('./handlers/RoleHandler');

class DiscordHandler {
  constructor(edge) {

    this.edge = edge

    this.messageHandler = new MessageHandler(this)
    this.roles = new RoleHandler(this)
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

    let player = new Player(this.client);
    await player.extractors.loadDefault();
    this.radio = await player.search(config.discord.voice.stream, {}).then(n => n.tracks[0])
 //https://discord-player.js.org/docs/discord-player/type/GuildQueueEvents
    const voice = fs.readdirSync(path.join(__dirname, './voice')).filter((file) => file.endsWith(".js"));
    let voiceCount = voice.length
    for (const file of voice) {
      try {
          const event = require(`./voice/${file}`)
          player.events.on(file.split(".")[0], event.bind(null, this.edge));
      } catch (e) {
          console.error(e)
          voiceCount -= 1
      }
    }
    
    console.discord(`${voiceCount}/${voice.length} Voice Events Loaded`)
  } 

}

module.exports = DiscordHandler