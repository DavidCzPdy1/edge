
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, MentionableSelectMenuBuilder } = require('discord.js')
const { useMainPlayer } = require('discord-player')
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'table',
  description: 'Table test command!',
  permissions: [{ id: '378928808989949964', type: 'USER', permission: true }],
  options: [],
  type: 'slash',
  platform: 'discord',
  run: async (edge, interaction) => {
    await interaction.deferReply({ ephemeral: true })

    
    const player = useMainPlayer();
    let queue = player.queues.cache.get(interaction.guild.id)

    if (!queue || !queue.length) return interaction.editReply({ content: 'Nic není ve frontě', ephemeral: true})

    console.log(queue.length)
    queue.node.skip();

    interaction.editReply({ content: 'Okk', ephemeral: true})

    return

    interaction.editReply({ content: 'Testing' })
  }
}