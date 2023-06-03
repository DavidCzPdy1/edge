
const path = require('node:path');
const fs = require('fs');

const DiscordHandler = require('./discord/DiscordHandler');
const TimeHandler = require('./time/TimeHandler');
const CommandsHandler = require('./commands/CommandsHandler');
const GoogleHandler = require('./google/GoogleHandler');

class UHGDevs extends CommandsHandler {
  constructor() {
    super()
  }
  async appStart() {
    this.discord = new DiscordHandler(this)
    this.time = new TimeHandler(this)
    this.google = new GoogleHandler(this)
  }

  async appConnect() {
    await this.createMongo()
    this.config.discord.enabled ? this.discord?.init() : null

    this.time?.init()
    this.google?.init()
  }
}

module.exports = new UHGDevs()