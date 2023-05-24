
const path = require('node:path');
const fs = require('fs');

module.exports = async (edge, client) => {

    console.discord('Client ready, logged in as ' + client.user.tag, {startup: true})
    client.user.setPresence({ activities: [ { name: 'Frisbee Games', type: 3 }, {name: 'Radio 7', type: 2} ], status: "online"})
    //console.log(client.user.presence)

    global.channels = {}
    global.channels.log = global.config.discord.loggingChannel ? await client.channels.fetch(global.config.discord.loggingChannel).catch(console.error) : null

    let botSlashCmds = edge.commands.filter(n => n.type == 'slash' || n.type == 'modal').map(cmd => { return { name: cmd.name, description: cmd.description||"", options: cmd.options || [], default_permission: Array.isArray(cmd.permissions) ? (cmd.permissions.length ? false : true) : true } });
    let userCommands = edge.commands.filter(n => n.type == 'user').map(cmd => { return {name: cmd.name, type: 2}})

    let cmds = await client.application.commands.set(botSlashCmds.concat(userCommands))


    await edge.discord.roles.init()
    edge.discord.roles.updateRoles()
    edge.discord.voice.init()
}