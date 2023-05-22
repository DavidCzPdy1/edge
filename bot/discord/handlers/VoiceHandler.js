const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus, createAudioResource, StreamType } = require('@discordjs/voice')

class VoiceHandler {
  constructor(discord) {
    this.edge = discord.edge
    this.discord = discord
  }

  async init() {

    const player = await createAudioPlayer();
    let voiceChannel = dc_client.channels.cache.get('1109943572825907243') 
    const connection = await joinVoiceChannel({channelId: voiceChannel.id, guildId: voiceChannel.guild.id, adapterCreator: voiceChannel.guild.voiceAdapterCreator })
    const resource = createAudioResource('https://icecast1.play.cz/radio7cz32.mp3', { inputType: StreamType.Arbitrary, });

    connection.subscribe(player)
    player.play(resource)



    player.on('stateChange', (oldState, newState) => {
      if (oldState.status === AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Playing) {
        console.discord('Playing audio output on audio player');
      } else if (newState.status === AudioPlayerStatus.Idle) {
        console.discord('Playback has stopped. Attempting to restart.');
        player.play(resource)
      }
    });

    this.connection = connection
    this.player = player
  
  }
  
}

module.exports = VoiceHandler
