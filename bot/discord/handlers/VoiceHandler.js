const { NoSubscriberBehavior, AudioPlayerStatus, entersState, joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, VoiceConnectionStatus } = require('@discordjs/voice')

class VoiceHandler {
  constructor(discord) {
    this.edge = discord.edge
    this.discord = discord
  }

  async init() {
    this.play()
  }

  play() {
    if (!this.edge.config.discord.voice.enabled) return this.connection.destroy()
    if (!this.connection) return this.newConnection()
  }

  newConnection(conn = null) {
    conn?.destroy()
    this.player?.removeAllListeners()

    if (!this.edge.config.discord.voice.enabled) return;

    let channel = dc_client.channels.cache.get(this.edge.config.discord.voice.channel)
    if (!channel) return undefined
    let connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfMute: false
    });

    //channel.guild.me.voice.setMute(false)
    
    channel.guild.members.cache.get(dc_client.user.id)?.edit({mute:false})


    const player = createAudioPlayer();
    const resource = createAudioResource(this.edge.config.discord.voice.stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
    //resource.volume.setVolume(1);

    connection.subscribe(player); 
    connection.on(VoiceConnectionStatus.Ready, () => { player.play(resource) })
    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
        try {
            let res = await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
        } catch (error) {
            this.newConnection(connection)
        }
    })
    player.on('error', error => {
        console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        try {
          const resource = createAudioResource(this.edge.config.discord.voice.stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
          //resource.volume.setVolume(1);
          player.play(resource)
        } catch (e) {
          this.newConnection(connection)
        }

    });
    player.on(AudioPlayerStatus.Playing, () => {
        //console.log('The audio player has started playing!');
    }); 
    player.on('idle', () => {
        this.newConnection(connection)
    })

    this.player = player
    this.connection = connection
  }
}

module.exports = VoiceHandler
