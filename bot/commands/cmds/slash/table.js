
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, MentionableSelectMenuBuilder, SlashCommandBuilder, PermissionFlagsBits, BitField } = require('discord.js')
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
    await interaction.deferReply({ ephemeral: edge.isEphemeral(interaction) })


    interaction.editReply({ content: 'Testing' })
  }
}