const axios = require('axios')
const { useMainPlayer } = require('discord-player');

module.exports = {
    name: 'voice-queue',
    description: 'See a queue!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [],
    type: 'sub',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })
      const player = useMainPlayer();

      let queue = player.queues.cache.get(interaction.guild.id)
      if (!queue) return interaction.editReply({ content: 'Nenašel jsem queue!'})

      if (queue.isEmpty() || !queue.currentTrack) return interaction.editReply({ content: 'V queue nic není' })

      let embed = { title: 'Queue statistiky', fields: [], color: 756367}
  
      embed.fields.push({ name: 'Currently Playing', value: `[${queue.currentTrack.title}](${queue.currentTrack.url})` })
      embed.fields.push({ name: 'Progress', value: queue.node.createProgressBar() })
  
      let songs = queue.tracks.toArray().map(t => `[${t.title}](${t.url})`).join('\n')
      
      embed.fields.push({name: 'Songs', value: songs, inline: false})
      return interaction.editReply({ embeds: [embed]})



    }
}