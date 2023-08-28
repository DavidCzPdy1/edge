
const path = require('node:path');
const fs = require('fs');

const { Collection } = require('discord.js');

const Mongo = require('../utils/Mongo')

class CommandsHandler extends Mongo {
  constructor() {
    super()
    this.createCommands()

  }
  
  createCommands() {
    let cmds = new Collection()
    let aliases = new Collection()
    let cmdCount = 0
    for (let file of fs.readdirSync(path.resolve(__dirname, './cmds/'))) {
        if (file.endsWith('.js')) {
            cmdCount ++
            try { delete require.cache[require.resolve(`./cmds/${file}`)] } catch (e) {}
            try {
              let cmd = require(`./cmds/${file}`)
              cmds.set(cmd.name, cmd)
              cmd.aliases.forEach(a => aliases.set(a, cmd.name));
            } catch (e) {console.error(e)}
        } else if (!file.includes('.')) {
            fs.readdirSync(path.resolve(__dirname, './cmds/'+file)).forEach(f =>{
                cmdCount ++
                try { delete require.cache[require.resolve(`./cmds/${file}/${f}`)] } catch (e) {}
                try {
                  let cmd = require(`./cmds/${file}/${f}`)
                  cmds.set(cmd.name, cmd)
                  cmd.aliases?.forEach(a => aliases.set(a, cmd.name));
                } catch (e) {console.error(e)}
            })
        }
    }

    cmds.filter(n => n.type == 'sub').forEach(c => {
      let command = cmds.get(c.name.split('-')[0])
      
      if (command) {
        command.options.push({ name: c.name.split('-')[1], description: c.description||"", type: 1, options: c.options || [] })
      }
    })

    this.commands = cmds
    this.aliases = aliases
    console.discord(`${this.commands.size}/${cmdCount} Commands Loaded`, { ignoreDiscord: true })
    return `${this.commands.size}/${cmdCount} Commands Loaded`
}

}

module.exports = CommandsHandler