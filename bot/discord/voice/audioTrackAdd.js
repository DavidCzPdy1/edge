module.exports = async (edge, queue, track) => {
    try {
        const entry = queue.tasksQueue.acquire();
        await entry.getTask();
       
        if (!queue.channel) {
            let channel = await dc_client.channels.fetch(edge.config.discord.voice.channel)
            await queue.connect(channel)
        }
    
        if (queue.isEmpty()) return queue.player.events.emit('emptyQueue', queue)
    
        if (!queue.isPlaying()) await queue.node.play()
        
    } finally { queue.tasksQueue.release() }
}