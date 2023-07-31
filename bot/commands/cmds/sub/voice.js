
module.exports = {
    name: 'voice',
    description: 'Voice test command!',
    permissions: [{ id: '378928808989949964', type: 'USER', permission: true}, { id: '1105555145456107581', type: 'ROLE', permission: true}],
    guild: ['1105413744902811688'],
    options: [],
    type: 'slash',
    platform: 'discord',
    run: (edge, interaction) => console.error('Zaplý base voic sub command')
}