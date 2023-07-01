const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const fs = require('fs');

let respawn;

module.exports = {
    name: "test",
    aliases: [],
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true }],
    platform: "dc",
    type: "message",
    run: async (edge, message, content) => {
        let args = content?.split(' ')

        if (args[0] == 'role') {
            let channel = message.guild.channels.cache.get('1108823268208676967')

            let embed = {
                title: 'Role',
                description: `<:dot:1109460785723351110>Rozděleno do tří sekcí!\n\n<:discord:1109464699843645531>➜ Pozice\n<:people:1109468903719059486> ➜ Tým\n<:custom:1109467732371570749> ➜ Ping\n\nPotřebuješ pomoc / něco nefunguje? Označ mě! ➜ <@&1109473883452612658>`,
                footer: { text: 'Klikni na tlačítko pro více informací', icon_url: message.guild.iconURL()},
            }

            let buttons =  new ActionRowBuilder()
              .addComponents(new ButtonBuilder().setCustomId('autorole_select_pozice')/*.setLabel('oznameni')*/.setStyle(2).setDisabled(false).setEmoji('<:discord:1109464699843645531>'))
              .addComponents(new ButtonBuilder().setCustomId('autorole_select_tym').setStyle(2).setDisabled(false).setEmoji('<:people:1109468903719059486>'))
              .addComponents(new ButtonBuilder().setCustomId('autorole_select_reaction').setStyle(2).setDisabled(false).setEmoji('<:custom:1109467732371570749>'))
              
     
            channel.send({ embeds: [embed], components: [buttons] })
            
            
        } else if (args[0] == 'info') {
            let channel = dc_client.guilds.cache.get('1105413744902811688')?.channels.cache.get('1107940836131479552')

            let commands = await dc_client.application.commands.fetch()
            let verify = commands.find(n => n.name == 'verify')?.id


            let description = [
                '<:dot:1109460785723351110> **Co je to EDGE?**',
                '➜ EDGE je kontaktní služba, která pomáhá navazovat vztahy s mladými lidmi skrze společný zájem – sport. V České republice skrze frisbee ultimate. EDGE jsou sportovní týmy, kde mají mladí lidé možnost trénovat své tělo i ducha. Mohou se učit a osvojovat si hodnoty jako spolupráce, týmový duch, férovost, vytrvalost nebo zodpovědnost.',
                '',
                '<:dot:1109460785723351110> **Co udělat po prvním přihlášení?**',
                `➜ Podívat se do <#1105546511519072286> na pravidla`,
                `➜ Podívat se do <#1105726655764365314> na nejnovější oznámení`,
                `➜ Podívat se do <#1108715450671579146> a napsat </verify:${verify}>`,
                `➜ Podívat se do <#1108823268208676967> a nastudovat si členění rolí, popřípadě si přiřadit ping role v položce <:custom:1109467732371570749>`,
                '',
                `<:dot:1109460785723351110> **Něco nejde?**`,
                `➜ Zeptej se v <#1108718621754150983>, nebo označ <@&1109473883452612658>`,
                ''
            ]
            let embed = {
                title: 'Oficiální EDGE Server!',
                description: description.join('\n'),
                color: 1813565,
                footer: {
                    text: 'EDGE Discord Informace',
                    icon_url: channel.guild.iconURL()
                }
            }
     
            await channel?.send({ embeds: [embed] })
            
        } else if (args[0] == 'verify') {
        let channel = dc_client.guilds.cache.get('1105413744902811688')?.channels.cache.get('1108715450671579146')

        let commands = await dc_client.application.commands.fetch()
        let verify = commands.find(n => n.name == 'verify')?.id


        let description = [
            `➜ Napiš </verify:${verify}>`,
            '',
            '<:dot:1109460785723351110> **Co to dělá?**',
            `➜ Změní ti jméno a přiřadí týmovou roli`,
            '',
            '<:dot:1109460785723351110> **Co je potřeba vyplnit?**',
            `➜ Jméno a příjmení`,
            `➜ Tým - pokud nejsi členem žádného týmu, nebo nechceš týmovou roli, tak můžeš napsat "ne"`,
        ]
        let embed = {
            title: 'Verify command',
            description: description.join('\n'),
            color: 1813565,
            footer: {
                text: 'EDGE Discord verify command',
                icon_url: channel.guild.iconURL()
            }
        }
 
        await channel?.send({ embeds: [embed] })
        
    } else if (args[0] == 'rules') {
        let channel = dc_client.guilds.cache.get('1105413744902811688')?.channels.cache.get('1105546511519072286')




        let description = [
            '**Discord pravidla**',
            '➜ Respektuj [discord TOS](https://discord.com/terms)',
            '➜ Chovej se slušně',
            '➜ Respektuj ostatní uživatele',
            '',
            '**Frisbee pravidla**',
            '➜ Odkaz [zde](https://www.cald.cz/pravidla-ultimate)'
        ]
        let embed = {
            //title: 'Discord Pravidla',
            description: description.join('\n'),
            color: 10574079,
            footer: {
                text: 'EDGE Discord pravidla',
                icon_url: channel.guild.iconURL()
            }
        }
 
        await channel?.send({ embeds: [embed] })
        
    }

    }
}
