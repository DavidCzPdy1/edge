const axios = require('axios')
const { useMainPlayer, useQueue } = require('discord-player');
const Extractors = require('@discord-player/extractor')

module.exports = {
    name: 'voice',
    description: 'Voice test command!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    guild: ['1105413744902811688'],
    options: [
      {
        name: 'query',
        description: 'Jakou chceš písničku?',
        type: 3,
        required: true,
        autocomplete: true
      },
      {
        name: 'mode',
        description: 'What should I do?',
        type: 3,
        required: false,
        choices: [
          { name: 'play', value: 'play' },
          { name: 'skip', value: 'skip' },
          { name: 'queue', value: 'queue' },
        ]
      },
      {
        name: 'options',
        description: 'Where should I look?',
        type: 3,
        required: false,
        choices: [
          { name: 'ALL', value: 'all' },
          { name: 'YouTube', value: 'YouTubeExtractor' },
          { name: 'Spotify', value: 'SpotifyExtractor' },
          { name: 'AppleMusic', value: 'AppleMusicExtractor' },
          { name: 'SoundCloud', value: 'SoundCloudExtractor' },
          { name: 'Vimeo', value: 'VimeoExtractor' },
        ]
      },
    ],
    type: 'slash',
    platform: 'discord',
    run: async (edge, interaction) => {
      await interaction.deferReply({ ephemeral: true })

      let song = interaction.options.getString('query')

      let mode = interaction.options.getString('mode') || 'play'

      let channel = dc_client.channels.cache.get(edge.config.discord.voice.channel)

      const player = useMainPlayer();

      let queue = player.queues.cache.get(interaction.guild.id)
      if (!queue) queue = player.queues.create(channel.guild, { skipOnNoStream: false, volume: 100, leaveOnEnd: false, leaveOnEmpty: false})
        
      
      if (mode == 'play') {

        let search = await player.search(song, { });
        if (!search.hasTracks()) return interaction.editReply({content: 'Nenašel jsem žádné video!'})


        let track = search.tracks[0]

        try {
          const entry = queue.tasksQueue.acquire();
          await entry.getTask();
        
          queue.addTrack(track);
          let currentTrack = queue.currentTrack?.metadata
          if (currentTrack?.title == 'radio7-128.mp3') queue.node.skip()


          interaction.editReply({ content: 'Added ' + track.title + ' to queue!', ephemeral: true})
          console.log(queue.tracks.toArray())
          
          return
        } finally { 
          console.log('done')
          queue.tasksQueue.release() }

      } else if (mode == 'skip') {
        if (!queue.isEmpty()) return interaction.editReply({ content: 'Není nic, co můžu přeskočit', ephemeral: true})

        try {
          const entry = queue.tasksQueue.acquire();
          await entry.getTask();
        
          queue.node.skip()        

          return interaction.editReply({ content: 'Skipped 1 song', ephemeral: true})
          
        } finally { queue.tasksQueue.release() }
      } else if (mode == 'queue') {
        if (queue.isEmpty() || !queue.currentTrack) return interaction.editReply({ content: 'V queue nic není"', ephemeral: true})

        let embed = { title: 'Queue statistiky', fields: [], color: 756367}

        embed.fields.push({ name: 'Currently Playing', value: `[${queue.currentTrack.title}](${queue.currentTrack.url})` })
        embed.fields.push({ name: 'Progress', value: queue.node.createProgressBar() })

        let songs = queue.tracks.toArray().map(t => `[${t.title}](${t.url})`).join('\n')
        
        embed.fields.push({name: 'Songs', value: songs, inline: false})
        return interaction.editReply({ embeds: [embed]})
      }
    
      

      

      interaction.editReply({ content: 'Nějaký error', ephemeral: true})

    },
    autocomplete: async (edge, interaction) => {

      let options = interaction.options.getString('options')
      let searchEngine = options && options !== 'all' ? `ext:${Extractors[options].identifier}` : 'auto'

      let player = useMainPlayer();
      const query = interaction.options.getString('query', true);
      const results = await player.search(query || config.discord.voice.stream, { searchEngine: searchEngine })
      return interaction.respond(
          results.tracks.slice(0, 20).map((t) => ({
              name: t.title == 'radio7-128.mp3' ? 'Rádio 7' : (t.title?.slice(0, 50) || '661Errors661') + `${t.raw.source ? ` (${t.raw.source})` : ''}`,
              value: t.url
          })).filter(a => !a.name.startsWith('661Errors661'))
      )
    }
}