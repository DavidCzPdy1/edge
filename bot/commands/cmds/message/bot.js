const { spawn, exec } = require('child_process');
const fs = require('fs');

let respawn;

module.exports = {
    name: "bot",
    aliases: [],
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true }],
    platform: "dc",
    type: "message",
    run: async (edge, message, content) => {
        let args = content?.split(' ')

        if (args[0] == 'stop') {
            await message.reply({  embeds: [{ author: { name: `Discord BOT stopped by ${message.author.username} using stop command` }, color: 15548997 }], failIfNotExists: false})

            return edge.stopBot(`Discord BOT stopped by ${message.author.username} using stop command`)
        }

        if (args[0] == 'restart') {
            if (!args[1]) {
                await message.reply({ content: 'Fully restarting bot', failIfNotExists: false })
                process.on('exit', () => {
                    let out = fs.openSync('log.log', 'a')
                    respawn = spawn('node', ['src/index.js'], { detached: true, stdio: [ 'ignore', 'inherit', 'inherit' ] });//'inherit'
                    respawn.unref();
                });
                edge.stopBot('Restarting bot')
            } else if (args[1] == 'commands') {
                return edge.createCommands()
            }
        } else return 'more category soon'
    }
}
