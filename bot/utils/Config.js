
const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js')
class Config {
  constructor() {

    this.config_start = true
    this.readConfig()
    fs.watchFile(path.resolve(__dirname, '../../config.json'), () => this.readConfig());

  }

  readConfig() {
    let config;
    if (this.config_start) {
      delete this.config_start

      config = this.mergeSettings(global.defaultConfig(), JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config.json'), 'utf8')));
      fs.writeFile(path.resolve(__dirname, '../../config.json'), JSON.stringify(config, null, 4), 'utf8', data =>{})

    } else config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config.json'), 'utf8'))

    if (config.dev === true) {
      for (let key in config.discord) {
        if (String(key).endsWith('_DEV')) continue
        if (config.discord[key + '_DEV']) config.discord[key] = config.discord[key + '_DEV']
      }

      for (let key in config.time) {
        if (String(key).endsWith('_DEV')) continue
        if (config.discord[key + '_DEV']) config.discord[key] = config.discord[key + '_DEV']
      }
    }
    global.config = config
    this.config = config
  }

  async editConfig(cesty, value) {
    let config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config.json'), 'utf8'))
    if (!Array.isArray(cesty)) cesty = [cesty]
    if (!Array.isArray(value)) value = [value]
    for (let o in cesty) {
      let p = config;
      let cesta = cesty[o].split('/').filter(n =>n)
      for (let i in cesta) {
        if (!p[cesta[i]] && i != cesta.length -1) p[cesta[i]] = {}
        i == cesta.length - 1 ? p[cesta[i]] = value[o] : p = p[cesta[i]]
      }
    }
    await fs.writeFile(path.resolve(__dirname, '../../config.json'), JSON.stringify(config, null, 4), 'utf8', data =>{})
    await delay(100)
  }

  handlePerms(perms, api) {
    if (!Array.isArray(perms) || !perms.length) return true
    let id = (api.user || api.author).id
    let allowed = perms?.find(n => n.type == 'USER' && id === n.id || n.type === 'ROLE' && api.member && api.member?._roles.includes(n.id) || n.type === 'ROLE' && n.guild && global.dc_client?.guilds?.cache.get(n.guild)?.members.cache.get(id)?._roles?.includes(n.id) || n.type == 'PERMS' && api.member && api.member.permissions?.has(n.id.filter(b=> Object.keys(PermissionsBitField.Flags).includes(b)).map(a => PermissionsBitField.Flags[a]))) || false
    if (allowed) return true
    else return false
    
    /*
    type 'PERMS' options:
    https://discord-api-types.dev/api/discord-api-types-payloads/common#PermissionFlagsBits
    */
  }

  switchPerms(perms) {
    if (!Array.isArray(perms) || !perms.length) return undefined

    perms = perms.filter(b => b.type !== 'USER')
    if (!perms.length) return 0
    
    let dcPerms = perms.filter(n => n.type == 'PERMS').map(n => n.id.filter(b=> Object.keys(PermissionsBitField.Flags).includes(b)).map(a => PermissionsBitField.Flags[a]))[0]
    if (dcPerms && dcPerms.length) return dcPerms[0]

    else return PermissionsBitField.Flags.ManageRoles
    
  }

  getCmdName(interaction) {
    let subcommand = interaction.options._subcommand
    if (subcommand) return interaction.commandName + '-' + subcommand
    return interaction.commandName
  }
  

  mergeSettings(def, given) {
    if (!given) return def;
    for (const key in def) {
      if (!Object.hasOwn(given, key) || given[key] === undefined) given[key] = def[key];
      else if (given[key] === Object(given[key])) given[key] = this.mergeSettings(def[key], given[key]);
    }
    return given;
  }

  async stopBot(message = 'Discord BOT was stopped') {
    if (global.shuting === true) return
    global.shuting = true

    await edge?.discord?.voice?.connection?.disconnect()
    await console.error(message).catch(e => { console.warn(e); process.exit() })
    global.shuting = false
    process.exit()
  }

}
  
module.exports = Config
  