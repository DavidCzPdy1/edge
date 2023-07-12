const { NoSubscriberBehavior, AudioPlayerStatus, entersState, joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, VoiceConnectionStatus } = require('@discordjs/voice')

class VoiceHandler {
  constructor(discord) {
    this.edge = discord.edge
    this.discord = discord
  }

  async init() {
    //this.setupBroadcast()
    //return
    
    this.player = createAudioPlayer({ behaviors: { noSubscriber: 'play', maxMissedFrames: 200 } });
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
    if (!this.connection?._state || !this.voiceChannel?.members.get(edge.config.discord.clientID)) this.joinChannel()
    if (this.connection?._state?.status !== 'ready') this.connection.subscribe(this.player)
    if (this.player?._state?.status !== 'playing') {
      this.resource = createAudioResource(this.edge.config.discord.voice.stream, { inputType: StreamType.Arbitrary, });
      this.player.play(this.resource)
    } 
  }

  joinChannel() {
    let voiceChannel = this.voiceChannel
    if (!voiceChannel) voiceChannel = dc_client.channels.cache.get(this.edge.config.discord.voice.channel)
    this.connection = joinVoiceChannel({ channelId: voiceChannel.id, guildId: voiceChannel.guild.id, adapterCreator: voiceChannel.guild.voiceAdapterCreator, selfMute: false })
  }

  setupBroadcast() {
    let channel = dc_client.channels.cache.get(this.edge.config.discord.voice.channel)
    if (!channel) return


    let connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guildId,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });
    const player = createAudioPlayer();
    const resource = createAudioResource(this.edge.config.discord.voice.stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
    //resource.volume.setVolume(1);
    connection.subscribe(player); 
    connection.on(VoiceConnectionStatus.Ready, () => {console.log("ready"); player.play(resource);})
    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
        try {
            console.log("Disconnected.")
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
        } catch (error) {
            connection.destroy();
        }
    });
    player.on('error', error => {
        console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        player.play(getNextResource());
    });
    player.on(AudioPlayerStatus.Playing, () => {
        console.log('The audio player has started playing!');
    }); 
    player.on('idle', () => {
        connection.destroy();
    })
  }

}

module.exports = VoiceHandler
