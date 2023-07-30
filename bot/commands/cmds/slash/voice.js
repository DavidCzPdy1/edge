const axios = require('axios')
const { useMainPlayer, useQueue } = require('discord-player');

module.exports = {
    name: 'voice',
    description: 'Voice test command!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    options: [],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let song = 'https://youtu.be/fLcVaq8uJIY?si=G4K6PxCFYZXXQQQw'
      let channel = dc_client.channels.cache.get(edge.config.discord.voice.channel)

      const player = useMainPlayer();
      
    
      let search = await player.search(song, { });

      let queue = player.queues.cache.get(interaction.guild.id)
      if (!queue) queue = player.queues.create(channel.guild, { skipOnNoStream: false, volume: 100, leaveOnEnd: false, leaveOnEmpty: false})
      
      const entry = queue.tasksQueue.acquire();
      await entry.getTask();
      
      queue.insertTrack(search, 0);

      try {
        if (!queue.isPlaying()) await queue.node.play();
    } finally {
        queue.tasksQueue.release();
    }
      


      interaction.editReply({ content: 'soon', ephemeral: true})
return


     // if (row) {
/*
        let porad = row.match(/(<strong>)(.*?)(<\/strong>: )/)
        if (porad.length) porad = porad[2]?.trim()
        let text = row.replace(/(<strong>)(.*?)(<\/strong>: )/i, '')?.trim()

        content = porad + ': ' + text
*/
/*
      let text = row.replace('<strong>', '').replace('</strong>', '').trim()
      let reg = / [A-Z][a-ž]*: /g
      let info = text.match(reg) ? text.match(reg).map((n, i) => n + text.split(reg)[i]) : [text]
      console.log(text)
      console.log(info)

      content = info.join('\n')
      }
      */

      


    }
}