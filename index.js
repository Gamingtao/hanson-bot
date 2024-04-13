const { Client, Events, GatewayIntentBits } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const { token } = require('./config.json');
const fs = require('fs');
const { onTimeResponses, lateResponses } = require('./responses');

const targetUserID = '143882111034720256';
const cooldownTime = 5 * 60 * 1000; // 5 minutes in milliseconds
const responseTime = 30 * 1000; // 30 seconds in milliseconds

let cooldown = false;
let data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));

const taoCommand = new SlashCommandBuilder()
    .setName('tao')
    .setDescription('Check if Tao is AFK');

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await client.application.commands.create(taoCommand);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() || interaction.commandName !== 'tao' || cooldown) return;

    cooldown = true;
    setTimeout(() => {
        cooldown = false;
    }, cooldownTime);

    await interaction.reply(`<@${targetUserID}> are you AFK?`);

    const filter = (m) => m.author.id === targetUserID;
    const collector = interaction.channel.createMessageCollector({ filter, time: responseTime });

    collector.on('collect', (m) => {
        const randomResponse = onTimeResponses[Math.floor(Math.random() * onTimeResponses.length)];
        interaction.followUp(randomResponse);
        collector.stop();
    });

    collector.on('end', (collected) => {
        if (collected.size === 0) {
            data.noResponseCount++;
            fs.writeFileSync('./data.json', JSON.stringify(data));
            const randomResponse = lateResponses[Math.floor(Math.random() * lateResponses.length)];
            interaction.followUp(randomResponse.replace('${noResponseCount}', data.noResponseCount));
        }
    });
});

client.login(token).catch((error) => {
    console.error('Error logging in:', error);
});