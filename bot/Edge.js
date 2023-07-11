
const path = require('node:path');
const fs = require('fs');

const express = require('express');
const server = express();

const DiscordHandler = require('./discord/DiscordHandler');
const TimeHandler = require('./time/TimeHandler');
const CommandsHandler = require('./commands/CommandsHandler');
const GoogleHandler = require('./google/GoogleHandler');

class UHGDevs extends CommandsHandler {
  constructor() {
    super()

    this.sendDm = {}
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

    if (this.config.keepAlive) {
      server.all('/', (req, res) => {
        res.send(`by DavidCzPdy`)
      })
      server.listen(3000, () => { });
    }
  }
}

module.exports = new UHGDevs()