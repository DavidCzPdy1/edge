const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus, createAudioResource, StreamType } = require('@discordjs/voice')

class VoiceHandler {
  constructor(discord) {
    this.edge = discord.edge
    this.discord = discord
  }

  async init() {

    this.player = createAudioPlayer({ behaviors: { noSubscriber: 'pause', maxMissedFrames: 200 } });
    this.voiceChannel = dc_client.channels.cache.get(this.edge.config.discord.voice.channel)
    this.resource = createAudioResource(this.edge.config.discord.voice.stream, { inputType: StreamType.Arbitrary, });

    this.play()
    this.player.on('stateChange', (oldState, newState) => {
      if (oldState.status === AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Playing) {
        console.discord('Playing audio output on audio player');
      } else if (newState.status === AudioPlayerStatus.Idle || newState.status == 'autopaused') {
        console.discord('Playback has stopped. Attempting to restart.');
        this.play()
      }
    })
  }
  play(perms = false) {
    if (!(this.edge.config.discord.voice.enabled || perms)) return;
    if (!this.voiceChannel?.members.get(edge.config.discord.clientID)) this.joinChannel()
    if (this.connection._state.status !== 'ready') this.connection.subscribe(this.player)
    if (this.player._state.status !== 'playing') this.player.play(this.resource)
  }

  joinChannel () {
    let voiceChannel = this.voiceChannel
    this.connection = joinVoiceChannel({ channelId: voiceChannel.id, guildId: voiceChannel.guild.id, adapterCreator: voiceChannel.guild.voiceAdapterCreator, selfMute: false })
  }

}

module.exports = VoiceHandler
