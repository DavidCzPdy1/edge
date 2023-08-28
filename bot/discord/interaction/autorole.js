const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

module.exports = async (edge, interaction) => {
    let action = interaction.customId.split('_')[1]
    let guild = interaction.guild


    if (action == 'reaction') {

        let roleId = interaction.customId.split('_')[2]

        if (!guild) return interaction.reply({ embeds: [{ title: 'ERROR v AUTOROLE interaction', description: `Wierd, nejsi na serveru`, color: 15548997, footer: { text: 'EDGE Bot', icon_url: guild?.iconURL() || '' } }], ephemeral: true });

        let member = guild.members.cache.get(interaction.user.id)
        if (!member) return interaction.reply({ embeds: [{ title: 'ERROR v AUTOROLE interaction', description: `Nebyl nalezen member!`, color: 15548997, footer: { text: 'EDGE Bot', icon_url: guild?.iconURL() || '' } }], ephemeral: true });

        let role = guild.roles.cache.get(roleId)
        if (!role) return interaction.reply({ embeds: [{ title: 'ERROR v AUTOROLE interaction', description: `Nebyla nalezena role!`, color: 15548997, footer: { text: 'EDGE Bot', icon_url: guild?.iconURL() || '' } }], ephemeral: true });

        let result = await edge.discord.roles.roleToggle(member, role)

        await interaction.reply({ embeds: [{ title: 'SUCCESS', description: `Úspěště ti byla ${result ? 'přidána':'odebrána'} role ${role}`, color: result ? 2067276 : 15548997, footer: { text: 'EDGE Dicord ROLE', icon_url: guild?.iconURL() || '' } }], ephemeral: true})

        
        console.discord(`AUTOROLE - <@${interaction.user.id}> ${result ? 'added' : 'removed'} ${role.name} - ${role}`)

        return

    }


    if (action == 'select') {
        let cat = interaction.customId.split('_')[2]

        let dot = '<:dot:1109460785723351110>'

        let embed = { title: 'ERROR v AUTOROLE - select interaction', description: `Nanašel jsem požadovanou kategorii!`, color: 15548997, footer: { text: 'EDGE Discord', icon_url: guild?.iconURL() || '' } }
        let components = []
        if (cat == 'pozice') embed = { title: 'Hlavní role', description: `<@&1105555145456107581> ➜ Role pro lidi, kteří EDGE řídí\n<@&1105544649080320110> ➜ Role pro trenéry\n<@&1105544581405229129> ➜ Role pro hráče s propojeným jménem`, color: 255255, footer: { text: 'Hlavní role EDGE Discordu', icon_url: guild?.iconURL() || '' }}
        else if (cat == 'tym') {
            let teams = (edge.discord.roles.teams || await edge.get('general', 'clubs', {})).map(n => n.id)
            let tymy = teams.map(n => `<@&${n}>`).join('\n')
            let desc = [
                `Každý může mít naráz jen **jednu** týmovou roli.\nO svou roli si lze požádát pomocí **/verify** příkazu.\n\n**Přehled týmů:**`,
                tymy,
                ``,
                ``,
                `Jsi v nějakém týmu a nemáš jeho roli? Použij **/verify**`
            ]
            embed = {
                title: 'Týmové role',
                description: desc.join('\n'),
                color: 2550,
                footer: { text: 'Týmové role EDGE Discordu', icon_url: guild?.iconURL() || '' }
            }
        } else if (cat == 'reaction') {
            embed = { title: 'Reaction role', description: '<:annouce:1109483778671382558> ➜ <@&1108829451309027328> ➜ Označení při novém oznámení\n<:people:1109468903719059486> ➜ <@&1141059014227132486> ➜ Označení při novém turnaji s hlednáním hráčů na hru *(více informací [zde](https://discord.com/channels/1105413744902811688/1110218138194301040))*\n', color: 800080, footer: { text: 'Reaction role EDGE Discord', icon_url: guild?.iconURL() || '' }}

            let buttons =  new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId('autorole_reaction_1108829451309027328')/*.setLabel('oznameni')*/.setStyle(2).setDisabled(false).setEmoji('<:annouce:1109483778671382558>'))
            .addComponents(new ButtonBuilder().setCustomId('autorole_reaction_1141059014227132486').setStyle(2).setDisabled(false).setEmoji('<:people:1109468903719059486>'))

            components = [buttons]
        }

        interaction.reply({ embeds: [embed], components: components, ephemeral: true })

    }
    
}
