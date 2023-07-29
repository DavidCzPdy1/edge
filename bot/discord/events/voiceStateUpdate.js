
const path = require('node:path');
const fs = require('fs');

module.exports = async (edge, oldState, newState) => {
    if (newState?.member?.user.id !== edge.config.discord.clientID) return
    if (newState.serverMute) newState.member.edit({mute:false})
}