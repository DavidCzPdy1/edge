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
        if (args[0] == 'quote') {message.channel.send({content: `Too much agreement kills a chat.`})}
        if (args[0] == 'role') {
            let channel = message.guild.channels.cache.get('1108823268208676967')

            let embed = {
                title: 'Role',
                description: `<:dot:1109460785723351110>Rozděleno do tří sekcí:\n\n<:discord:1109464699843645531> ➜ Hlavní role\n<:people:1109468903719059486> ➜ Týmové role\n<:custom:1109467732371570749> ➜ Role, které si každý vybírá sám\n\nPotřebuješ pomoc, nebo něco nefunguje? Označ mě! ➜ <@&1109473883452612658>`,
                footer: { text: 'Klikni na tlačítko pro více informací', icon_url: message.guild.iconURL()},
                color: 14634975
            }

            let buttons =  new ActionRowBuilder()
              .addComponents(new ButtonBuilder().setCustomId('autorole_select_pozice')/*.setLabel('oznameni')*/.setStyle(2).setDisabled(false).setEmoji('<:discord:1109464699843645531>'))
              .addComponents(new ButtonBuilder().setCustomId('autorole_select_tym').setStyle(2).setDisabled(false).setEmoji('<:people:1109468903719059486>'))
              .addComponents(new ButtonBuilder().setCustomId('autorole_select_reaction').setStyle(2).setDisabled(false).setEmoji('<:custom:1109467732371570749>'))
              
     
            channel.send({ embeds: [embed], components: [buttons] })
            
            
        } else if (args[0] == 'info') {
            let channel = dc_client.guilds.cache.get('1105413744902811688')?.channels.cache.get('1105546511519072286')

            let commands = await dc_client.application.commands.fetch()
            let verify = commands.find(n => n.name == 'verify')?.id

            /*
            '<:dot:1109460785723351110> **Co je to EDGE?**',
                '➜',
                '',
            */

            let description = [
                `Vítej na EDGE serveru!`,
                '',
                '<:dot:1109460785723351110> **Co mám udělat po prvním přihlášení?**',
                `➜ Podívej se do <#1105726655764365314> na nejnovější oznámení`,
                `➜ Podívej se do <#1108715450671579146> a napiš </verify:${verify}>`,
                `➜ Podívej se do <#1108823268208676967> na rozložení discord rolí <:custom:1109467732371570749>`,
                '',
                '<:dot:1109460785723351110> **Proč tu jsem?**',
                `➜ Získávej oficiální informace z první ruky`,
                `➜ </tym:${commands.find(n => n.name == 'tym')?.id}> příkaz ukazuje aktuální informace jednotlivých týmů`,
                `➜ Nemáš s kým hrát? [Přihlaš](https://discord.com/channels/1105413744902811688/1110218138194301040) se před turnajem a domluv si start za jiný tým!`,
                '',
                `<:dot:1109460785723351110> **Nevíš si rady, nebo něco nefunguje?**`,
                `➜ Zeptej se v <#1108718621754150983>, nebo označ <@&1109473883452612658>`,
                ''
            ]
            let embed = {
                title: 'Oficiální EDGE Server',
                description: description.join('\n'),
                color: 1813565,
                footer: {
                    text: 'EDGE Discord Informace',
                    icon_url: channel.guild.iconURL()
                }
            }
     
            if (args[1] || message.reference) {
                let msg = await channel?.messages.fetch(args[1] || message.reference.messageId)
                await msg.edit({ embeds: [embed], components: [] })
                await message?.delete()
            } else channel.send({ embeds: [embed], components: [] })
            
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
        
    } else if (args[0] == 'rakety') {
        let channel = message.guild.channels.cache.get('1141313863703334982')
        channel = message.channel

        let embed = {
            title: 'V jakém jsi týmu?',
            description: `<:dum:1109508725519159306> ➜ U15\n<:champion:1141315219369500766> ➜ A-Tým\n<:people:1109468903719059486> ➜ Návštěvník`,
            color: 15844367
        }

        let buttons =  new ActionRowBuilder()
          .addComponents(new ButtonBuilder().setCustomId('rozdeleni_button_U15').setStyle(2).setDisabled(false).setEmoji('<:dum:1109508725519159306>'))
          .addComponents(new ButtonBuilder().setCustomId('rozdeleni_button_Home').setStyle(2).setDisabled(false).setEmoji('<:champion:1141315219369500766>'))
          .addComponents(new ButtonBuilder().setCustomId('rozdeleni_button_G').setStyle(2).setDisabled(false).setEmoji('<:people:1109468903719059486>'))
          
 
        channel.send({ embeds: [embed], components: [buttons] })
    } else if (args[0] == 'pdy') {
        let channel = message.guild.channels.cache.get('1141313863703334982')
        channel = message.channel

        let embed = {
            title: 'Verifikace',
            description: `<:dum:1109508725519159306> ➜ Domácí tým\n<:people:1109468903719059486> ➜ Návštěvník`,
            color: 154367
        }

        let buttons =  new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId('rozdeleni_button_Home').setStyle(2).setDisabled(false).setEmoji('<:dum:1109508725519159306>'))
            .addComponents(new ButtonBuilder().setCustomId('rozdeleni_button_G').setStyle(2).setDisabled(false).setEmoji('<:people:1109468903719059486>'))
 
        channel.send({ embeds: [embed], components: [buttons] })
    } else if (args[0] == 'pdyInfo') {
        let guild = message.guild
        let channel = message.channel
        let infoEmbed = { title: 'Micropachycephalosauři Poděbrady', description: 'Zázemí pro frisbee hráče z Poděbrad a okolí, ale vítaní jsou i všichni ostatní\n\n<:dot:1109460785723351110>**Docházka na tréninky** ➜ <#1128307712552337419>\n<:dot:1109460785723351110>**Přihlášky na turnaje** ➜ <#1135644875287699576>\n<:dot:1109460785723351110>**Oznámení a hlasování** ➜ <#1128330001641652305>\n\nVyplň **Reaction Role**, jestliže:\n<:dot:1109460785723351110>Chceš lepší upozornění\n<:dot:1109460785723351110>Nejsi v týmu, ale chceš na trénink přijít / chceš vidět aktuální informace týkajících se tréninků\n\nNějaký problém? ➜ <@378928808989949964>', color: 16405504, footer: { text: 'Micropachycephalosauři Discord info', icon_url: guild?.iconURL() || '' }}

        if (args[1] || message.reference) {
            let msg = await channel?.messages.fetch(args[1] || message.reference.messageId)
            await msg.edit({ embeds: [infoEmbed], components: [] })
        } else channel.send({ embeds: [infoEmbed], components: [] })

    } else if (args[0] == 'pdyRole') {
        let guild = message.guild
        let channel = message.channel
        let roleEmbed = { title: 'Reaction Role', description: '<:annouce:1109483778671382558> ➜ <@&1142167646930997368> ➜ Notifikace při novém oznámení nebo hlasování\n<:champion:1141315219369500766> ➜ <@&1128309507190181928> ➜ Notifikace při novém tréninku\n<:people:1109468903719059486> ➜ <@&1142160090988826795> ➜ Přístup k tréninkům\n', color: 16405504, footer: { text: 'Micropachycephalosauři Discord role', icon_url: guild?.iconURL() || '' }}
        let buttons =  new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId('autorole_reaction_1142167646930997368')/*.setLabel('oznameni')*/.setStyle(2).setDisabled(false).setEmoji('<:annouce:1109483778671382558>'))
        .addComponents(new ButtonBuilder().setCustomId('autorole_reaction_1128309507190181928')/*.setLabel('oznameni')*/.setStyle(2).setDisabled(false).setEmoji('<:champion:1141315219369500766>'))
        .addComponents(new ButtonBuilder().setCustomId('autorole_reaction_1142160090988826795').setStyle(2).setDisabled(false).setEmoji('<:people:1109468903719059486>'))

        if (args[1] || message.reference) {
            let msg = await channel?.messages.fetch(args[1] || message.reference.messageId)
            await msg.edit({ embeds: [roleEmbed], components: [buttons] })
        } else channel.send({ embeds: [roleEmbed], components: [buttons] })
    } else if (args[0] == 'buttons') {
        let channel = message.channel

        let team = await edge.get('general', 'clubs', {}).then(n => n.find(a => a.server?.guild === message.guild.id))
        if (!team) return 'Nenašel jsem tento server v databázi'

        let nastaveni = team.server.buttons
        if (!nastaveni) return 'Nenašel jsem nastavení tohoto serveru'
        /* 
        if (message.guild.id == '1128307451066855515') nastaveni = [
            {id: '0', title: 'Domácí tým', emoji: '<:dum:1109508725519159306>', roles: ['1128327834549628979', '1142158365460533259']},
            {id: '1', title: 'Návštěvník', emoji: '<:people:1109468903719059486>', roles: ['1142158365460533259']}
        ];
        if (message.guild.id == '1122995611621392424') nastaveni = [
            {id : '0', title: 'U15', emoji: '<:dum:1109508725519159306>', roles: ['1142174015734173816']},
            {id : '1', title: 'U15 - Rodič', emoji: '<:people:1109468903719059486>', roles: ['1142174716170350813']},
            {id : '2', title: 'A-Tým', emoji: '<:champion:1141315219369500766>', roles: ['1142172522092183712']}
        ]
        */

        let embed = {
            title: 'Verifikace',
            description: nastaveni.map(n => `${n.emoji} ➜ ${n.title}`).join('\n'),
            color: team.color
        }

        let buttons =  new ActionRowBuilder()

        for (let role of nastaveni) {
            buttons.addComponents(new ButtonBuilder().setCustomId('rozdeleni_button_'+role.id).setStyle(2).setDisabled(false).setEmoji(role.emoji))
        }

        //team.server.buttons = nastaveni
        //await edge.post('general', 'clubs', team)
        let embeds = []
        let rakety = [
            'Vítej na serveru ultimate frisbee týmu Rakety Žižkoff. Tento server slouží pro komunikaci v rámci týmu mezi hráči, rodiči hráčů a trenéry. V případě, že nejsi ani jedním z výše zmíněných, prosím opusť tento server.',
            '',
            '❔  Co udělat hned po prvním přihlášení? ❔',
            '',
            '1️⃣ Vyber, jaká je tvá role v týmu Rakety Žižkoff. Hráč A-týmu / hráč U15 / rodič U15.',
            '2️⃣ Nastav si zobrazované jméno do formátu “jméno příjmení #role kategorie”. Podrobnější návod, jak na to, najdeš v channelu <#1143097631803965481>. Pokud chceš trenérům ulehčit orientaci, nastav si i profilový obrázek.',
            '3️⃣ Pokud si s čímkoliv nevíš rady, podívej se do channelu <#1143097631803965481>. Pokud tam nenajdeš odpověď, neboj se napsat někomu z vedoucích. Důležité kontakty:',
            '👉 správce serveru - <@778577790744133652>', 
            '👉 kontaktní osoba pro A-tým - <@1013485719366418463> ',
            '👉 kontaktní osoba pro U15 - Adam Vejvoda'
        ]
        let raketyInfo = {
            title: 'Rakety Žižkoff',
            description: rakety.join('\n'),
            color: team.color
        }

        if (message.guild.id == '1122995611621392424') embeds.push(raketyInfo)
        embeds.push(embed)
        if (args[1] || message.reference) {
            let msg = await channel?.messages.fetch(args[1] || message.reference.messageId)
            await msg.edit({ embeds: embeds, components: [buttons] })
            await message.delete()
        } else channel.send({ embeds: embeds, components: [buttons] })
    } else if (args[0] == 'lf') {
        let guild = message.guild
        let channel = message.channel
        let infoEmbed = { title: 'Hledání týmu', description: `**LF team**, je funkce (v <:beta2_1:1145658257415864330><:beta2_2:1145658259957616680> verzi), která propojuje jednotlivé hráče s konkrétními týmy a pomáhá všem si každý turnaj užít na maximum.\n\n**Před turnajem** se pošle krátká zpráva s tlačítky. Po kliknutí na tlačítko se zobrazí formulář s několika otázkami. Odpovědi se přepošlou všem trenérům. Trenér, který hledá hráče do týmu, pak jednotlivé hráče může kontaktovat.\n\n**Krátké FQA:**\n**Kdy mám LF team použít?**\nKdyž chceš jet na turnaj, ale nemáš svůj tým\n\n**Už mám vyplněnou odpověď, ale na turnaj nechci jet**\nPokud tě ještě nikdo nekontaktovat, tak jednoduše klikni na druhé tlačítko \`Chci zrušit žádost\`. Pokud tě už někdo kontaktoval, řeš to nejdřív prosím s daným člověkem a poté až klikni na tlačitko.`, color: 16405504}

        if (args[1] || message.reference) {
            let msg = await channel?.messages.fetch(args[1] || message.reference.messageId)
            await msg.edit({ embeds: [infoEmbed], components: [] })
            await message.delete()
        } else channel.send({ embeds: [infoEmbed], components: [] })

    } 


    }
}
