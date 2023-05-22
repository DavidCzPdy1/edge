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
              .addComponents(new ButtonBuilder().setCustomId('autorole_select_reaction').setStyle(2).setDisabled(false).setEmoji('<:discord:1109464699843645531>'))
              
     
            channel.send({ embeds: [embed], components: [buttons] })
            
            
        }

    }
}
