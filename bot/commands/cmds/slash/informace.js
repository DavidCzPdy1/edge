const fs = require('fs');
const path = require('node:path');
const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder } = require('discord.js')

module.exports = {
    name: 'informace',
    description: 'Informace TOOL TIP!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/informace.json'), 'utf8'));

      let options = data.embeds.map(n => { return { label: n.title, value: n.title }})
      options.push({ label: "New EMBED", value: "new" })

      const buttons = new ActionRowBuilder()
        //.addComponents(new ButtonBuilder().setCustomId(`informace_cmd_edit`).setStyle(2).setLabel('RUN'))
        .addComponents(new ButtonBuilder().setCustomId(`informace_cmd_send`).setStyle(3).setLabel('SEND'))

      const menu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('informace_cmd_select').setPlaceholder('Choose embed to edit').addOptions(options));

      //let msg = interaction.options.getString('message')

      await interaction.editReply({ embeds: [{title:`Information SETUP`, color: 2067276}], components: [menu, buttons]})
    },
    send: async (edge, interaction) => {
      try { await interaction.update({ type:6, ephemeral: true }) } catch (e) {}
      let data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/informace.json'), 'utf8'));

      let channel = dc_client.channels.cache.get(data.channel)
      
      if (!channel) return interaction.followUp({ content: `Channel with ID \`${data.channel}\`is not found!`, ephemeral: true})

      if (!channel.messages.cache.size) await channel.messages.fetch()
      let message = await channel.messages.cache.get(data.message)
      if (!message) {
        let access = channel.guild.members.me?.permissionsIn(channel.id).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]);
        if (!access) return interaction.followUp({ content: `Bot nemá práva posílat zprávy do <#${channel.id}>`, ephemeral: true})
        message = await channel.send({ embeds: data.embeds.length ? composeEmbeds(data.embeds) : composeEmbeds([{ title: 'TEMPLATE MESSAGE', color: 2067276 }]) })
        data.message = message.id
        await fs.writeFile(path.join(__dirname, '../../../../data/informace.json'), JSON.stringify(data, null, 4), 'utf8', n =>{})
        return interaction.followUp({ content: `Created new message!`, ephemeral: true})
      }

      await message.edit({ embeds: data.embeds.length ? composeEmbeds(data.embeds) : composeEmbeds([{ title: 'TEMPLATE MESSAGE', color: 2067276 }]) })

      return interaction.followUp({ content: `Edited message!`, ephemeral: true})
      
    },
    select: async (edge, interaction) => {
      try { await interaction.update({ type:6, ephemeral: true }) } catch (e) {}
      let data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/informace.json'), 'utf8'));

      let type = (interaction.values?.length ? interaction.values[0] : null) || data.embeds.find(n => n.title == interaction.message.embeds[0].title).title || 'new'

      //if (type == 'new') { return }

      const buttons = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`informace_cmd_edit`).setStyle(2).setLabel('EDIT'))
        .addComponents(new ButtonBuilder().setCustomId(`informace_cmd_delete`).setStyle(4).setLabel('DELETE'))
        .addComponents(new ButtonBuilder().setCustomId(`informace_cmd_send`).setStyle(3).setLabel('SEND'))


      let options = data.embeds.map(n => { return { label: n.title, value: n.title }})
      options.push({ label: "New EMBED", value: "new" })
      const menu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('informace_cmd_select').addOptions(options).setPlaceholder(`${type == 'new' ? 'Nový embed' : type}`));

      let embed = {
        title: type,
        description: 'soon'
      }

      interaction.editReply({ embeds: [embed], components: [menu, buttons]})
    },
    edit: async (edge, interaction) => {
      //try { await interaction.update({ type:6, ephemeral: true }) } catch (e) {}
      let data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/informace.json'), 'utf8'));
      let type = data.embeds.find(n => n.title == interaction.message.embeds[0].title)?.title || 'new'

      let embed = data.embeds.find(n => n.title = type) || {}

      const textBox = (options) => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(options.id).setLabel(options.text).setPlaceholder(options.example ?? '').setStyle(options.style || 1).setRequired(options.required ?? true).setValue(options.value || '').setMaxLength(options.max ?? 4000).setMinLength(options.min ?? 0))

      const modal = new ModalBuilder().setCustomId('informace_cmd_recieve_'+type).setTitle(type)
        .addComponents(textBox({ id: 'title', text: 'Název', example: undefined, value: embed.title}))
        .addComponents(textBox({ id: 'description', text: 'Description', example: undefined, value: embed.description, style: 2}))
        .addComponents(textBox({ id: 'footer', text: 'Footer|icon|image|position', example: 'Edge server|*|link|1', value: embed.footer}))
        .addComponents(textBox({ id: 'color', text: 'Barva (decimal code)', example: '2067276', value: String(embed.color)}))
        
      return await interaction.showModal(modal);

      
    },
    delete: async (edge, interaction) => {
      try { await interaction.update({ type:6, ephemeral: true }) } catch (e) {}

      let data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/informace.json'), 'utf8'));
      let type = data.embeds.find(n => n.title == interaction.message.embeds[0].title).title
      data.embeds.filter(n => n.title != type)
      console.log(data.embeds)
      await fs.writeFile(path.join(__dirname, '../../../../data/informace.json'), JSON.stringify(data, null, 4), 'utf8', n =>{})

      let options = data.embeds.map(n => { return { label: n.title, value: n.title }})
      options.push({ label: "New EMBED", value: "new" })
      const buttons = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId(`informace_cmd_send`).setStyle(3).setLabel('SEND'))

      const menu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('informace_cmd_select').setPlaceholder('Choose embed to edit').addOptions(options));

      interaction.editReply({ embeds: [{title:`${type} embed DELETED`, color: 5592575}], components: [menu, buttons]})
    },
    recieve: async (edge, interaction) => {
      await interaction.reply({ content: 'Applying Changes', ephemeral: true });

      let data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/informace.json'), 'utf8'));
      let type = interaction.customId.replace('informace_cmd_recieve_', '')
      let embed = {
        title: interaction.fields.getTextInputValue('title'),
        description: interaction.fields.getTextInputValue('description'),
        footer: interaction.fields.getTextInputValue('footer'),
        color: Number(interaction.fields.getTextInputValue('color')),
      }

      data.embeds.filter(n => n.title != type)
      data.embeds.push(embed)

      data.embeds.sort((a, b) =>  Number(a.footer?.split('|').length > 3 ? a.footer.split('|')[3] : 0) - Number(b.footer?.split('|').length > 3 ? b.footer.split('|')[3] : 0))

      await fs.writeFile(path.join(__dirname, '../../../../data/informace.json'), JSON.stringify(data, null, 4), 'utf8', n =>{})
    },

}

function composeEmbeds(embeds) {

  return embeds.map(e => {
    return {
      title: e.title,
      description: e.description,
      color: e.color,
      fields: e.fields?.length ? e.fields.map(f => {
        return {
          name: '\u200b',
          value: '\u200b',
          inline: false,
        }
      }) : [],
      url: undefined,
      author: {
        name: undefined,
        icon_url: undefined,
        url: undefined
      },
      thumbnail: {
        url: undefined
      },
      image: {
        url: e.footer?.split('|') ?.length > 2 ? e.footer.split('|')[2]?.replace('*', '') : undefined
      },
      timestamp: undefined,
      footer: {
        text: e.footer?.split('|').length ? e.footer.split('|')[0] : undefined,
        icon_url: e.footer?.split('|') ?.length > 1 ? e.footer.split('|')[1]?.replace('*', '') : undefined
      }

    }
  })
}