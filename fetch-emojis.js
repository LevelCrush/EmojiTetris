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
const USE_BASE64 = process.env.USE_BASE64 === 'true' || false;

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
        https.get(url, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                
                if (USE_BASE64) {
                    // Return base64 data URL
                    const base64 = buffer.toString('base64');
                    const mimeType = filename.endsWith('.gif') ? 'image/gif' : 'image/png';
                    const dataUrl = `data:${mimeType};base64,${base64}`;
                    resolve({ dataUrl, buffer });
                } else {
                    // Save file normally
                    fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
                    console.log(`Downloaded: ${filename}`);
                    resolve({ buffer });
                }
            });
        }).on('error', (err) => {
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
            guildId: guild.id,
            useBase64: USE_BASE64
        };

        // Download each emoji
        let index = 0;
        for (const [id, emoji] of emojis) {
            if (index >= 7) break; // Only need 7 emojis for Tetris
            
            const extension = emoji.animated ? 'gif' : 'png';
            const filename = `${emoji.name}_${id}.${extension}`;
            const url = emoji.url;

            try {
                const result = await downloadEmoji(url, filename);
                
                const emojiData = {
                    id: id,
                    name: emoji.name,
                    filename: filename,
                    animated: emoji.animated,
                    url: url,
                    index: index
                };
                
                if (USE_BASE64) {
                    emojiData.dataUrl = result.dataUrl;
                    console.log(`Converted ${emoji.name} to base64`);
                }
                
                manifest.emojis.push(emojiData);
                index++;
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
        
        if (USE_BASE64) {
            console.log('\n✨ Base64 mode enabled - emojis embedded in manifest.json');
            console.log('This mode works with GitHub Pages without Git LFS!');
        }

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
    console.error('USE_BASE64=true  # Optional: for GitHub Pages without Git LFS');
    console.error('\nOption 2: Run with environment variables:');
    console.error('DISCORD_BOT_TOKEN=your_token DISCORD_GUILD_ID=your_guild_id npm run fetch-emojis');
    process.exit(1);
}

// Run the script
fetchEmojis();