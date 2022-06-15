const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const path = require('path');

const themes = require('../themes.json');
const db = require('../database');

function profileEmbed(character) {
    const iconAttachment = new MessageAttachment(path.join(__dirname, "..", "images", "icons", themes[character.aspect].icon));
    const embed = new MessageEmbed()
        .setTitle(character.name)
        .setColor(themes[character.aspect].colour)
        .addFields(
            { name: "Class", value: character.class, inline:true  },
            { name: "Aspect", value: character.aspect, inline:true }
        )
        .setThumbnail(`attachment://${themes[character.aspect].icon}`)
    
    return {embed: embed, attachments: [iconAttachment]}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Commands relating to the player profiles.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Sets your player profile.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The character\'s name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('class')
                        .setDescription('Your character\'s class')
                        .setRequired(true)
                        .addChoices(
                            { name: "Bard", value: "Bard" },
                            { name: "Heir", value: "Heir" },
                            { name: "Knight", value: "Knight" },
                            { name: "Mage", value: "Mage" },
                            { name: "Maid", value: "Maid" },
                            { name: "Page", value: "Page" },
                            { name: "Prince", value: "Prince" },
                            { name: "Rogue", value: "Rogue" },
                            { name: "Seer", value: "Seer" },
                            { name: "Sylph", value: "Sylph" },
                            { name: "Thief", value: "Thief" },
                            { name: "Witch", value: "Witch" }
                        )
                )
                .addStringOption(option =>
                    option.setName('aspect')
                        .setDescription('Your character\'s aspect')
                        .setRequired(true)
                        .addChoices(
                            { name: "Blood", value: "Blood" },
                            { name: "Breath", value: "Breath" },
                            { name: "Doom", value: "Doom" },
                            { name: "Heart", value: "Heart" },
                            { name: "Hope", value: "Hope" },
                            { name: "Light", value: "Light" },
                            { name: "Life", value: "Life" },
                            { name: "Mind", value: "Mind" },
                            { name: "Rage", value: "Rage" },
                            { name: "Space", value: "Space" },
                            { name: "Time", value: "Time" },
                            { name: "Void", value: "Void" }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('view')
                .setDescription('Displays the given profile')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The character\'s name')
                        .setRequired(true)
                )
        ),
        async execute(interaction) {
            if (interaction.options.getSubcommand() === 'set') {
                const character = {
                    name: interaction.options.getString('name'),
                    class: interaction.options.getString('class'),
                    aspect: interaction.options.getString('aspect')
                }
                db.insertDocument(db.COLLECTIONS.CHARACTER, character);
                await interaction.reply(`Profile set.`);
            }
            if (interaction.options.getSubcommand() === 'view') {
                const character = await db.firstDocument(db.COLLECTIONS.CHARACTER, {name: interaction.options.getString('name')});
                if (character) {
                    const { embed, attachments } = profileEmbed(character)
                    await interaction.reply({ embeds: [embed], files: attachments });
                } else {
                    await interaction.reply('Could not find a character with that name.');
                }
            }
	},
};
