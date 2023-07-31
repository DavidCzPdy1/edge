
module.exports = async (edge, queue) => {

    try {
        const entry = queue.tasksQueue.acquire();
        await entry.getTask();
       
        if (queue.isEmpty()) {
            queue.addTrack(edge.discord.radio)
        }
        
    } finally { queue.tasksQueue.release() }
}