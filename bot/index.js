process.on('uncaughtException', function (error) {console.error(error)})

const { exec } = require('child_process')
const path = require('node:path');


const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');

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

const command = `cd "${path.join(__dirname, '../UHGDevs/apps/bot')}" && npm start`;

if (config.uhg) {
const UHG = exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`UHG Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`UHG Stderr: ${stderr}`);
        return;
    }
    console.log(`UHG Stdout: ${stdout}`);
});

UHG.on('close', (code) => {
    console.log(`UHG app exited with code ${code}`);
});

}