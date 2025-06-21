#!/usr/bin/env node

require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration - will read from .env file
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const GUILD_ID = process.env.DISCORD_GUILD_ID || 'YOUR_GUILD_ID_HERE';
const OUTPUT_DIR = path.join(__dirname, 'emojis');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create Discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Function to download emoji
function downloadEmoji(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(OUTPUT_DIR, filename));
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(path.join(OUTPUT_DIR, filename), () => {});
            reject(err);
        });
    });
}

// Main function
async function fetchEmojis() {
    try {
        await client.login(DISCORD_BOT_TOKEN);
        console.log('Bot logged in successfully!');
        
        // List all guilds the bot has access to
        console.log('\nBot has access to the following guilds:');
        const guilds = await client.guilds.fetch();
        guilds.forEach(guild => {
            console.log(`- ${guild.name} (ID: ${guild.id})`);
        });
        
        console.log(`\nAttempting to fetch guild with ID: ${GUILD_ID}`);

        const guild = await client.guilds.fetch(GUILD_ID);
        console.log(`Fetching emojis from guild: ${guild.name}`);

        const emojis = await guild.emojis.fetch();
        console.log(`Found ${emojis.size} custom emojis`);

        // Create emoji manifest
        const manifest = {
            emojis: [],
            fetchedAt: new Date().toISOString(),
            guildName: guild.name,
            guildId: guild.id
        };

        // Download each emoji
        for (const [id, emoji] of emojis) {
            const extension = emoji.animated ? 'gif' : 'png';
            const filename = `${emoji.name}_${id}.${extension}`;
            const url = emoji.url;

            try {
                await downloadEmoji(url, filename);
                manifest.emojis.push({
                    id: id,
                    name: emoji.name,
                    filename: filename,
                    animated: emoji.animated,
                    url: url
                });
            } catch (error) {
                console.error(`Failed to download ${emoji.name}: ${error.message}`);
            }
        }

        // Save manifest
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        console.log('Emoji manifest saved!');

        // Disconnect client
        client.destroy();
        console.log('Done! Emojis saved to:', OUTPUT_DIR);

    } catch (error) {
        console.error('Error:', error.message);
        
        if (error.code === 10004) {
            console.error('\n❌ Unknown Guild - The bot cannot access this server.');
            console.error('\nPossible solutions:');
            console.error('1. Make sure the bot is invited to your Discord server');
            console.error('2. Verify the DISCORD_GUILD_ID in your .env file is correct');
            console.error('3. Use the bot invite link with the necessary permissions:');
            console.error(`   https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=1073741824&scope=bot`);
            console.error('\nNote: Replace YOUR_BOT_CLIENT_ID with your bot\'s client ID');
        }
        
        client.destroy();
        process.exit(1);
    }
}

// Check if token is provided
if (DISCORD_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('Please provide your Discord bot token!');
    console.error('\nOption 1: Create a .env file with:');
    console.error('DISCORD_BOT_TOKEN=your_bot_token');
    console.error('DISCORD_GUILD_ID=your_guild_id');
    console.error('\nOption 2: Run with environment variables:');
    console.error('DISCORD_BOT_TOKEN=your_token DISCORD_GUILD_ID=your_guild_id npm run fetch-emojis');
    process.exit(1);
}

// Run the script
fetchEmojis();