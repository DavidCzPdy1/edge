
const chalk = require('chalk')

process.title = 'By DavidCzPdy'
global.path = process.mainModule.path


/* 
DELAY
@param {time}
@returns {promise}
@usage await delay (ms)
*/
global.delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/* 
DISCORD log
@param {message, footer}
@returns {embed}
@usage console.discord("text")
*/
console.discord = (message, args = {}) => {
  console.log(chalk.bgMagenta.black(`[${getCurrentTime()}] Discord >`) + ' ' + chalk.magenta(message))

  let embed = { title: 'Discord', description: `**${message}**`, color: 2067276, footer: { text: args.startup ? 'settings display soon' : null } }
  if (global.config?.discord.log_channel === true) global.channels?.log?.send({ embeds: [embed] })
  return embed
}

/* 
MONGO log
@param {message, footer}
@returns {embed}
@usage console.mongo("text")
*/
console.mongo = (message, args = {}) => {
  console.log(chalk.bgBlue.black(`[${getCurrentTime()}] Mongo >`) + ' ' + chalk.blue(message))

  let embed = { title: 'Mongo', description: `**${message}**`, color: 2067276, footer: { text: args.startup ? 'settings display soon' : null } }
  if (global.config?.discord.log_channel === true) global.channels?.log?.send({ embeds: [embed] })
  return embed
}


/* 
TIME log
@param {message, footer}
@returns {embed}
@usage console.cron("text")
*/
console.cron = (message, args = {}) => {
  console.log(chalk.green.black(`[${getCurrentTime()}] TIME >`) + ' ' + chalk.greenBright(message))

  let embed = { title: 'Time', description: `**${message}**`, color: 2067276, footer: { text: args.startup ? 'settings display soon' : null } }
  if (global.config?.discord.log_channel === true) global.channels?.log?.send({ embeds: [embed] })
  return embed
}


/* 
ERROR log
@param {message, type}
@returns {embed}
@usage await console.error(err, name)
 - await required when stopping bot
*/
console.error = async (message, type = '') => {
  let windows = global.path.slice(0, 5).includes("\\")
  let reg = windows ?
    new RegExp(`${global.path.replaceAll('\\', '\\\\').replace('/', '\\\\')}.*:(\\d.):(\\d.)`) :
    new RegExp(`${global.path}.*:(\\d.):(\\d.)`)

  let path = windows ?
    (String(message.stack).match(reg) ? String(message.stack).match(reg)[0].replace(global.path.replace('/', '\\'), '') : 'unknown path') :
    (String(message.stack).match(reg) ? String(message.stack).match(reg)[0].replace(global.path, '') : 'unknown path')

  let embed = { author: { name: String(message).trim() }, description: type || null, color: 15548997, footer: { text: path !== 'unknown path' ? path : null } }

  //console.log(message)

  console.log(chalk.bgRedBright.black(`[${getCurrentTime()}] Error >`) + ' ' + chalk.redBright(message) + chalk.blueBright(`${path !== 'unknown path' ? ` at ${global.path + path}` : ''}`))
  if (global.config?.log_channel === true) {
    await global.channels?.log?.send({
      embeds: [embed]
    })
  }
  return embed
}


/* 
Default Config
@param {}
@returns {object}
@usage defaultConfig()
 - returns default config
*/
global.defaultConfig = () => {
  return {
    dev: true,
    discord: {
      prefix: ',',
      enabled: true,
      log_channel: true,
      clientID: '1105929725186150411',
      serverID: '1105413744902811688',
      loggingChannel: '1106243507527635005',
      voice: {
        enabled: true,
        channel: '1109943572825907243',
        stream: 'https://icecast8.play.cz/radio7-128.mp3'
      },
      roles: {
        position_edge: '1105555145456107581',
        position_trener: '1105544649080320110',
        position_member: '1105544581405229129',
        mention_oznameni: '1108829451309027328',
        mention_lfman: '1108826232700805250',
        mention_lfwoman: '1108826423839424595',
        split_position: '1108827093514596544',
        split_club: '1108826950950211745',
        split_mention: '1108826744573661204',
        club_majak: '1108825493739929620',
        club_arrows: '1108833486321758291',
        club_hammers: '1108825718776926208',
        club_micro: '1108825861190340720',
        club_sky: '1108825076083720263',
        club_poletime: '1108825185932542102',
        club_rakety: '1108825318069903443',
        club_fox: '1108825782001860730'
      }
    },
    time: {}
  }
}


/* 
Get Current Time
@param {}
@returns {string}
@usage getCurrentTime()
 - returns current time
*/
function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}
console.date = getCurrentTime


/* 
Format
@param {number, dec}
@returns {string}
@usage f(0,1111111, 1)
 - returns 0,1
*/
global.f = (number, max=2) => { return Number(number) ? Number(number).toLocaleString('en', {minimumFractionDigits: 0, maximumFractionDigits: max}) : number }