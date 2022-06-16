const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const path = require('path');

const themes = require('../themes.json');
const db = require('../database');

const confirmDeleteButton = new MessageButton()
    .setCustomId('confirm-delete-profile')
    .setLabel('Delete')
    .setStyle('DANGER')
    .setEmoji('💥')

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
        if (character.quote) {
            embed.setDescription(`*${character.quote}*`)
        }
        if (character.image) {
            embed.setImage(character.image)
        }
        
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
                .addStringOption(option =>
                    option.setName('quote')
                        .setDescription('A quote to display with your character')
                        .setRequired(false)
                )
                .addAttachmentOption(option => 
                    option.setName('image-attachment')
                        .setDescription('Character image')
                        .setRequired(false)    
                )
                .addStringOption(option => 
                    option.setName('image-url')
                        .setDescription('Character image')
                        .setRequired(false)    
                )
                .addStringOption(option => 
                    option.setName('info')
                        .setDescription('Character information')
                        .setRequired(false)    
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
        )
        .addSubcommand(subcommand =>
            subcommand.setName('delete')
                .setDescription('Deletes a given profile')
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
                    aspect: interaction.options.getString('aspect'),
                    userId: interaction.user.id,
                    quote: interaction.options.getString('quote') ?? null,
                    info: interaction.options.getString('info') ?? null,
                    image: interaction.options.getAttachment('image-attachment')?.url ?? interaction.options.getString('image-url') ?? null
                }
                db.addCharacter(character);
                await interaction.reply(`Profile set.`);
            }
            if (interaction.options.getSubcommand() === 'view') {
                const character = await db.findCharacter({name: interaction.options.getString('name')});
                if (character) {
                    const { embed, attachments } = profileEmbed(character)
                    await interaction.reply({ embeds: [embed], files: attachments });
                } else {
                    await interaction.reply('Could not find a character with that name.');
                }
            }
            if (interaction.options.getSubcommand() === 'delete') {
                const character = await db.findCharacter({ name: interaction.options.getString('name') });
                if (character) {
                    const { embed, attachments } = profileEmbed(character)
                    const row = new MessageActionRow().addComponents(confirmDeleteButton, );
                    await interaction.reply({ content: 'Are you sure you want to delete this profile?', embeds: [embed], files: attachments, components: [row] });

                    const filter = i => i.customId === confirmDeleteButton.customId && i.user.id === interaction.user.id;
                    const collector = interaction.channel.createMessageComponentCollector({filter, time: 15000});

                    collector.on('collect', async i => {
                        if (i.customId === confirmDeleteButton.customId) {
                            db.deleteCharacter(character)
                            i.update({ content: 'Profile deleted.', embeds: [], components: [], files: [] });
                        }
                    })

                } else {
                    await interaction.reply('Could not find a character with that name.');
                }
            }
	    },
};
