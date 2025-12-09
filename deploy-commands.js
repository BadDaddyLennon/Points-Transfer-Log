const { SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

// --- Configuration Constants ---
// ⚠️ INSERT YOUR BOT'S TOKEN AND IDs DIRECTLY HERE FOR LOCAL DEPLOYMENT ⚠️
const DISCORD_TOKEN = 'YOUR_BOT_TOKEN_HERE'
const CLIENT_ID = 'YOUR_APPLICATION_ID_HERE'; // The Application ID (Bot ID)
const GUILD_ID = YOUR_GUILD_ID_HERE''; // The Server ID

const commands = [
    new SlashCommandBuilder()
        .setName('logpoints')
        .setDescription('Logs a new points transaction.')
        .addStringOption(option =>
            option.setName('player') // NAME CHANGED: player_id -> player
                .setDescription('The Player Name or EOS ID.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('action')
                .setDescription('The type of point transaction.')
                .setRequired(true)
                .addChoices(
                    { name: '➕ Added (Credit)', value: 'Added' },
                    { name: '➖ Deducted (Debit)', value: 'Deducted' },
                    { name: '🔄 Balance Adjusted', value: 'Balance Adjusted' },
                    { name: '❓ Other Action (Non-Point)', value: 'Other Action' },
                ))
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('The number of points transferred.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason') // NAME CHANGED: reason_misc -> reason
                .setDescription('Type a reason or select a standard suggestion.')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option => // NEW FIELD: For custom required explanation
            option.setName('misc_detail')
                .setDescription('REQUIRED if Reason is "Misc". Otherwise ignore.')
                .setRequired(false)), 
    
    new SlashCommandBuilder()
        .setName('viewlog')
        .setDescription('Displays the most recent points transactions.'),
    
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN); 

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(
                CLIENT_ID, // Use the client ID here
                GUILD_ID  // Use the guild ID here
            ),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error("Failed to deploy commands:", error);
        console.error("Please ensure CLIENT_ID and GUILD_ID variables are correct at the top of the file.");
    }
})();