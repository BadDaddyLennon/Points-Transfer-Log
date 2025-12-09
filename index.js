const { 
    Client, 
    GatewayIntentBits,
} = require('discord.js');
const fetch = require('node-fetch'); 

// --- Configuration Constants (Embedded) ---
//⚠️ 1. Replace with your actual DISCORD BOT TOKEN ⚠️
const DISCORD_TOKEN = 'YOUR_BOT_TOKEN_HERE';
// ⚠️ 2. Replace with your actual JSONBIN SECRET KEY ⚠️
const JSONBIN_SECRET_KEY = '$2a$10$Y7RyMSyB.GU67ZJdEbqQuuwdj7UJhht8mdy.Ytjf1CJHThjMoj0SW';
// ⚠️ 3. Ensure this URL matches your JSONBIN BIN ID ⚠️
const API_URL = `https://api.jsonbin.io/v3/b/6920a528ae596e708f67f685`;

// --- Reason List (Embedded) ---
const REASONS_LIST = [
    // NEW ENTRY: This month's Legend
    { name: 'This months Legend (5k points)', value: 'This months Legend (5k points)' }, 
    
    { name: 'Discord Boost (1k points)', value: 'Discord Boost (1k points)' },
    { name: 'Server Donation (1k points)', value: 'Server Donation (1k points)' },
    { name: 'Mod Developer Donation (1k points)', value: 'Mod Developer Donation (1k points)' },
    { name: 'Mee6 Lvl 10 (2k points)', value: 'Mee6 Lvl 10 (2k points)' },
    { name: 'Mee6 Lvl 15 (3k points)', value: 'Mee6 Lvl 15 (3k points)' },
    { name: 'Mee6 Lvl 20 (4k points)', value: 'Mee6 Lvl 20 (4k points)' },
    { name: '1st in Accessories Leaderboard (5k points)', value: '1st in Accessories Leaderboard (5k points)' },
    { name: '2nd in Accessories Leaderboard (3k points)', value: '2nd in Accessories Leaderboard (3k points)' },
    { name: '3rd in Accessories Leaderboard (1k points)', value: '3rd in Accessories Leaderboard (1k points)' },
    { name: 'Completing the Feedback Survey (2.5k)', value: 'Completing the Feedback Survey (2.5k)' },
    { name: 'Bought in another player (1k)', value: 'Bought in another player (1k)' },
    { name: 'Shop Refund', value: 'Shop Refund' },
    
    // NEW MISC ENTRY
    { name: 'Misc (Manual Entry Required)', value: 'Misc' }, 
    
    { name: 'Manual Deduction (Admin)', value: 'Manual Deduction (Admin)' },
    { name: 'Admin Correction', value: 'Admin Correction' },
    { name: 'Server Ban - Cheating', value: 'Server Ban - Cheating' },
    { name: 'Server Ban - Exploiting', value: 'Server Ban - Exploiting' }
];

const PLACEHOLDER_ENTRY = { text: "PLACEHOLDER", html: "", search: "ignore placeholder", timestamp: Date.now(), actionClass: "other" };


// --- Discord Client Initialization ---
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
    ]
});

// Bot is ready listener
client.once('ready', () => {
    console.log(`Bot is logged in as ${client.user.tag}!`);
    client.user.setActivity('Logging Points | Use /logpoints'); 
});


// --------------------------------------------------------------------------
// --- JSONBin Data Functions (UNCHANGED) ---
// --------------------------------------------------------------------------

async function loadEntries() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'X-Master-Key': JSONBIN_SECRET_KEY }
        });
        const data = await response.json();
        const records = data.record || data;
        return Array.isArray(records) ? records.filter(entry => entry.text !== "PLACEHOLDER") : [];
    } catch (error) {
        console.error("Could not load log from server.", error);
        return []; 
    }
}

async function saveEntries(logEntries) {
    let dataToSend = logEntries.length > 0 ? logEntries : [PLACEHOLDER_ENTRY];
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_SECRET_KEY },
            body: JSON.stringify(dataToSend)
        });
        if (!response.ok) { throw new Error(`HTTP error! Status: ${response.status}`); }
        console.log("Log saved to server successfully.");
        return true;
    } catch (error) {
        console.error("Could not save log to server. Error details:", error);
        return false;
    }
}


// --- Utility Functions (UNCHANGED) ---

function getFormattedDateTime() {
    const now = new Date();
    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const datePart = now.toLocaleDateString('en-GB', dateOptions);
    const timePart = now.toLocaleTimeString('en-US', timeOptions);
    return `${datePart} at ${timePart}`;
}

function getActionClass(action) {
    if (action.includes('Added')) return 'added';
    if (action.includes('Deducted')) return 'deducted';
    if (action.includes('Balance Adjusted')) return 'adjusted';
    return 'other';
}


// --- SLASH Command Handler Functions ---

async function handleLogPointsSlash(interaction) {
    // UPDATED: Use simplified option names 'player' and 'reason'
    const nameId = interaction.options.getString('player');
    const whatDid = interaction.options.getString('action');
    const amount = interaction.options.getInteger('amount');
    const reason = interaction.options.getString('reason');
    const miscDetail = interaction.options.getString('misc_detail'); 

    // --- VALIDATION AND REASON HANDLING ---
    let whatFor = reason;

    if (reason === 'Misc' || reason.toLowerCase().includes('misc (manual')) {
        if (!miscDetail) {
            return interaction.editReply('❌ **Validation Error:** You selected "Misc." Please provide details in the `misc_detail` field.');
        }
        // If Misc is selected, the log reason becomes the user's detailed input
        whatFor = `Misc: ${miscDetail}`; 
    } else if (miscDetail) {
        // If they filled the optional detail box but didn't select Misc, use the selected reason.
        console.warn("User entered misc_detail but did not select Misc.");
    }
    // ----------------------------------


    const timestamp = getFormattedDateTime();
    const actionClass = getActionClass(whatDid);

    let logEntries = await loadEntries();

    const entryText = `${whatDid} | Amount: ${amount} | Player: ${nameId} | Reason: ${whatFor} | Logged: ${timestamp}`;
    const newEntry = {
        text: entryText,
        html: "", 
        search: `${nameId.toLowerCase()} ${whatDid.toLowerCase()} ${amount.toString().toLowerCase()} ${whatFor.toLowerCase()}`,
        timestamp: Date.now(),
        actionClass: actionClass
    };
    
    logEntries.push(newEntry);
    const success = await saveEntries(logEntries);

    if (success) {
        const colorMap = { 'Added': 0x2ECC71, 'Deducted': 0xE74C3C, 'Balance Adjusted': 0x3498DB, 'Other Action': 0xFF69B4 };

        const confirmationEmbed = {
            color: colorMap[whatDid],
            title: '✅ New Points Log Entry Saved!',
            fields: [
                { name: 'Player', value: `**${nameId}**`, inline: true }, // Changed name
                { name: 'Action', value: `**${whatDid}**`, inline: true },
                { name: 'Amount', value: `**${amount.toLocaleString()}**`, inline: true },
                { name: 'Reason', value: `*${whatFor}*` },
            ],
            footer: {
                text: `Logged by ${interaction.member.displayName} on ${timestamp}`
            }
        };
        interaction.editReply({ embeds: [confirmationEmbed] });
    } else {
        interaction.editReply('🚨 **ERROR:** Failed to save log entry to the server. Check the console for details.');
    }
}


// --- Main Interaction Listener (Router) ---

client.on('interactionCreate', async interaction => {
    // --- 1. AUTO-COMPLETE HANDLER ---
    if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'logpoints') {
            const focusedValue = interaction.options.getFocused();
            const filtered = REASONS_LIST.filter(choice => 
                choice.name.toLowerCase().includes(focusedValue.toLowerCase())
            );
            await interaction.respond(
                filtered.slice(0, 25).map(choice => ({ name: choice.name, value: choice.value })),
            );
        }
        return; 
    }


    // --- 2. COMMAND HANDLER ---
    if (!interaction.isCommand()) return;

    if (!interaction.member || !interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ You do not have administrator permissions to use this command.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    if (interaction.commandName === 'logpoints') {
        await handleLogPointsSlash(interaction);
    } 
    else if (interaction.commandName === 'viewlog') {
        interaction.editReply('View log requested. You can check the web interface.');
    }
});


// --- Connect to Discord ---

client.login(DISCORD_TOKEN);