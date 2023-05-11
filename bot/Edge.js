
const path = require('node:path');
const fs = require('fs');

const DiscordHandler = require('./discord/DiscordHandler');
const TimeHandler = require('./time/TimeHandler');
const CommandsHandler = require('./commands/CommandsHandler');

class UHGDevs extends CommandsHandler {
  constructor() {
    super()
  }
  async appStart() {
    this.discord = new DiscordHandler(this)
    this.time = new TimeHandler(this)
  }

  async appConnect() {
    this.config.discord.enabled ? this.discord?.init() : null

    this.time?.init()
  }
}

module.exports = new UHGDevs()