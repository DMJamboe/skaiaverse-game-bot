const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require('../database');
const { makeCard } = require('../game/game');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('card')
		.setDescription('Displays a given card.')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('The card\'s name')
                .setRequired(true)    
        ),
    async execute(interaction) {
        const card = await db.findCard({name: interaction.options.getString('name')});
        if (card) {
            makeCard(card);
        }
    }
}