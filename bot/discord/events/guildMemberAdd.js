
const path = require('node:path');
const fs = require('fs');

module.exports = async (edge, member) => {
    if (member.user.bot) return
    if (member.guild.id === '1105413744902811688') await edge.discord.roles.updateRoles([member.user.id])
    else await edge.discord.roles.updateClubs([member.guild.id])
}