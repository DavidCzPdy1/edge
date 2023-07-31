
module.exports = async (edge, queue, track) => {
    try {
        const entry = queue.tasksQueue.acquire();
        await entry.getTask();
       
        if (queue.isEmpty()) queue.player.events.emit('emptyQueue', queue)
        else if (!queue.isPlaying()) await queue.node.play()
        
    } finally { queue.tasksQueue.release() }
    
}