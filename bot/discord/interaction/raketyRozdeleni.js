const { ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } = require("discord.js");
const axios = require('axios');
const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

module.exports = async (edge, interaction) => {
    let action = interaction.customId.split('_')[1]
    let type = interaction.customId.split('_')[2]

    let user;

    if (action == 'button') {

        user = await edge.get('general', 'users', {_id: interaction.user.id}).then(n => n[0])
        if (!user) {
            const modal = new ModalBuilder().setCustomId(`raketyRozdeleni_verify_${type}`).setTitle(`Zadání jména!`)
            .addComponents(textBox({ id: 'jmeno', text: 'Jaké máš jméno?', example: 'Jméno Příjmení', value: undefined, required: true}))

            return await interaction.showModal(modal);
        } else await interaction.update({ type: 6 })
    } else if (action == 'verify') {
        await interaction.update({ type: 6 })
        let jmeno = interaction.fields.fields.get('jmeno').value
        
        user = {_id: interaction.user.id, name: jmeno, team: type === 'G' ? 'ne' : '1108825318069903443', list: type === 'G' ? [] : ['1108825318069903443'], blacklist: []}
        try {
          if (process.env.namesApi) {
            let url = `https://api.parser.name/?api_key=${process.env.namesApi}&endpoint=extract&text=${jmeno.replaceAll(' ', '%20')}`
            let result = await axios.get(url)
            if (result.data.data?.length) {
              let gender = result.data.data[0].parsed.name.firstname.gender
              if (gender == 'm') user.gender = 'M'
              else if (gender == 'f') user.gender = 'W'
            }
          }
        } catch (e) {}
        
        await edge.post('general', 'users', user)
        console.discord(`${jmeno} - Rakety verifikace jako ${type}`)
        edge.discord.roles.updateRoles([interaction.user.id])
    }

    if (user.team !== '1108825318069903443' && user.team !== 'ne' && (type == 'U15' || type == 'A')) return interaction.followUp({ ephemeral: true, content: 'Nemůžu tě verifikovat! Máš vybraný jiný tým!'});
    
    if (type =='U15') interaction.followUp({ ephemeral: true, content: 'Ještě nevím co mám dělat s U15'});
    else if (type == 'A') interaction.followUp({ ephemeral: true, content: 'Ještě nevím co mám dělat s A-Týmem'});
    else interaction.followUp({ ephemeral: true, content: 'Ještě nevím co mám dělat s návštěvníky'});
}
