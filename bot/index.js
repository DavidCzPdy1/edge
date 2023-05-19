process.on('uncaughtException', function (error) {console.error(error)})

const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');
const path = require('path');

require('./utils/functions')

let config = fs.readdirSync(path.join(__dirname, '../')).filter(n => n == 'config.json').length
if (!config) fs.writeFile(path.join(__dirname, '../config.json'),  JSON.stringify({}, null, 4), 'utf-8', data => {})

delay(100).then(async () => {
    const edge = require('./Edge')
    global.edge = edge

    await edge.appStart()

    await edge.appConnect()
})

process.on('SIGINT', async () => {
    if (global.shuting === true) return
    edge.stopBot('Discord BOT byl násilně ukončen')
})