
const axios = require('axios')
const { useMainPlayer, useQueue } = require('discord-player');

const eventName = module.filename.includes('/') ? module.filename.split('/').filter(n => n.endsWith('.js'))[0].split('.')[0] : module.filename.split('\\').filter(n => n.endsWith('.js'))[0].split('.')[0]

module.exports = {
  name: eventName,
  description: "Voice time event",
  emoji: '🎶',
  time: '0 * * * * *', //'*/10 * * * * *'
  ignore: '* * * * * *', //'sec min hour den(mesic) mesic den(tyden)'
  onstart: true,
  run: async (edge, options) => {
    
    let content = 'EDGE discord'

    if (!dc_client.readyTimestamp) await delay(5000)


    let channel = await dc_client.channels.fetch(edge.config.discord.voice.channel)
    const player = useMainPlayer();

    let queue = player.queues.cache.get(channel.guild.id)
    if (!queue) queue = player.queues.create(channel.guild, { skipOnNoStream: false, volume: 100, leaveOnEnd: false, leaveOnEmpty: false})
    
    if (!queue.channel) queue.connect(channel)

    await delay(100)

    const entry = queue.tasksQueue.acquire();
    await entry.getTask();
    
    queue.addTrack(edge.discord.radio)

    queue.setRepeatMode(1)

    try {
      if (!queue.isPlaying()) await queue.node.play();
  } finally {
      queue.tasksQueue.release();
  }

    //if (!queue?.isPlaying()) await queue.play(channel, search, { volume: 100, leaveOnEnd: false, leaveOnEmpty: false})
    

/*
    let row = await axios.get(`https://m.radio7.cz/vysilame_row.php`).then(n => n.data)
    if (row) {
      let porad = row.match(/(<strong>)(.*?)(<\/strong>: )/)
      if (porad?.length) porad = porad[2]?.trim()
      let text = row.replace(/(<strong>)(.*?)(<\/strong>: )/i, '')?.trim()

      content = porad + ': ' + text
    }
    */

    //let voice = edge.discord.voice
    //voice.play()
    
  }
}