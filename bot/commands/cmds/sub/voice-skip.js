const axios = require('axios')
const { useMainPlayer } = require('discord-player');

module.exports = {
    name: 'voice-skip',
    description: 'Skip a song!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [],
    type: 'sub',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })
      const player = useMainPlayer();

      let queue = player.queues.cache.get(interaction.guild.id)
      if (!queue) return interaction.editReply({ content: 'Nenašel jsem queue!'})

      if (queue.isEmpty()) return interaction.editReply({ content: 'Není nic, co můžu přeskočit', ephemeral: true})

      try {
        const entry = queue.tasksQueue.acquire();
        await entry.getTask();
      
        queue.node.skip()        

        interaction.editReply({ content: 'Skipped 1 song'})
        
      } finally { queue.tasksQueue.release() }



    }
}