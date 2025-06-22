#!/usr/bin/env node

require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration - will read from .env file
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const GUILD_ID = process.env.DISCORD_GUILD_ID || 'YOUR_GUILD_ID_HERE';
const EMOJI_DIR = path.join(__dirname, 'emojis');
const SOUND_DIR = path.join(__dirname, 'sounds');
const STICKER_DIR = path.join(__dirname, 'stickers');
const USE_BASE64 = process.env.USE_BASE64 === 'true' || false;

// Ensure output directories exist
[EMOJI_DIR, SOUND_DIR, STICKER_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Create Discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// Function to download file
function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                
                if (USE_BASE64) {
                    // Determine MIME type based on file extension
                    let mimeType = 'application/octet-stream';
                    if (filename.endsWith('.gif')) mimeType = 'image/gif';
                    else if (filename.endsWith('.png')) mimeType = 'image/png';
                    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) mimeType = 'image/jpeg';
                    else if (filename.endsWith('.webp')) mimeType = 'image/webp';
                    else if (filename.endsWith('.mp3')) mimeType = 'audio/mpeg';
                    else if (filename.endsWith('.ogg')) mimeType = 'audio/ogg';
                    else if (filename.endsWith('.wav')) mimeType = 'audio/wav';
                    
                    const base64 = buffer.toString('base64');
                    const dataUrl = `data:${mimeType};base64,${base64}`;
                    resolve({ dataUrl, buffer });
                } else {
                    resolve({ buffer });
                }
            });
            response.on('error', reject);
        });
    });
}

// Main function
async function fetchDiscordAssets() {
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
        console.log(`Fetching assets from guild: ${guild.name}`);

        // 1. Fetch Emojis
        console.log('\n=== FETCHING EMOJIS ===');
        const emojis = await guild.emojis.fetch();
        console.log(`Found ${emojis.size} custom emojis`);
        
        const emojiManifest = {
            emojis: [],
            fetchedAt: new Date().toISOString(),
            guildName: guild.name,
            guildId: guild.id,
            useBase64: USE_BASE64
        };

        let emojiIndex = 0;
        for (const [id, emoji] of emojis) {
            const extension = emoji.animated ? 'gif' : 'png';
            const filename = `${emoji.name}_${id}.${extension}`;
            const url = emoji.url;
            const filePath = path.join(EMOJI_DIR, filename);
            
            console.log(`Downloading emoji ${emojiIndex + 1}/${emojis.size}: ${emoji.name}`);
            
            try {
                const result = await downloadFile(url, filename);
                
                if (!USE_BASE64) {
                    fs.writeFileSync(filePath, result.buffer);
                }
                
                const emojiData = {
                    id: emoji.id,
                    name: emoji.name,
                    filename: filename,
                    animated: emoji.animated,
                    url: url,
                    index: emojiIndex
                };
                
                if (USE_BASE64) {
                    emojiData.dataUrl = result.dataUrl;
                }
                
                emojiManifest.emojis.push(emojiData);
                emojiIndex++;
            } catch (error) {
                console.error(`Failed to download emoji ${emoji.name}: ${error.message}`);
            }
        }
        
        // Save emoji manifest
        fs.writeFileSync(
            path.join(EMOJI_DIR, 'manifest.json'),
            JSON.stringify(emojiManifest, null, 2)
        );
        console.log(`Emoji manifest saved with ${emojiManifest.emojis.length} emojis!`);

        // 2. Fetch Soundboard Sounds
        console.log('\n=== FETCHING SOUNDBOARD SOUNDS ===');
        const soundManifest = {
            sounds: [],
            fetchedAt: new Date().toISOString(),
            guildName: guild.name,
            guildId: guild.id,
            useBase64: USE_BASE64
        };
        
        try {
            const sounds = await guild.soundboardSounds.fetch();
            console.log(`Found ${sounds.size} soundboard sounds`);
            
            let soundIndex = 0;
            for (const [id, sound] of sounds) {
                console.log(`Downloading sound ${soundIndex + 1}/${sounds.size}: ${sound.name}`);
                
                try {
                    const soundUrl = `https://cdn.discordapp.com/soundboard-sounds/${sound.soundId}`;
                    const extension = 'ogg'; // Discord soundboard sounds are typically in OGG format
                    const filename = `${sound.name.replace(/[^a-zA-Z0-9]/g, '_')}_${sound.soundId}.${extension}`;
                    const filePath = path.join(SOUND_DIR, filename);
                    
                    const result = await downloadFile(soundUrl, filename);
                    
                    if (!USE_BASE64) {
                        fs.writeFileSync(filePath, result.buffer);
                    }
                    
                    const soundData = {
                        id: sound.soundId,
                        name: sound.name,
                        filename: filename,
                        emoji: sound.emojiName || null,
                        emojiId: sound.emojiId || null,
                        volume: sound.volume || 1.0,
                        index: soundIndex
                    };
                    
                    if (USE_BASE64) {
                        soundData.dataUrl = result.dataUrl;
                    }
                    
                    soundManifest.sounds.push(soundData);
                    soundIndex++;
                } catch (error) {
                    console.error(`Failed to download sound ${sound.name}: ${error.message}`);
                }
            }
        } catch (error) {
            console.log('Could not fetch soundboard sounds:', error.message);
        }
        
        // Save sound manifest
        fs.writeFileSync(
            path.join(SOUND_DIR, 'manifest.json'),
            JSON.stringify(soundManifest, null, 2)
        );
        console.log(`Sound manifest saved with ${soundManifest.sounds.length} sounds!`);

        // 3. Fetch Stickers
        console.log('\n=== FETCHING STICKERS ===');
        const stickerManifest = {
            stickers: [],
            fetchedAt: new Date().toISOString(),
            guildName: guild.name,
            guildId: guild.id,
            useBase64: USE_BASE64
        };
        
        try {
            const stickers = await guild.stickers.fetch();
            console.log(`Found ${stickers.size} stickers`);
            
            let stickerIndex = 0;
            for (const [id, sticker] of stickers) {
                console.log(`Downloading sticker ${stickerIndex + 1}/${stickers.size}: ${sticker.name}`);
                
                try {
                    // Determine file extension based on format
                    let extension = 'png';
                    if (sticker.format === 2) extension = 'apng'; // Animated PNG
                    else if (sticker.format === 3) extension = 'lottie'; // Lottie animation
                    else if (sticker.format === 4) extension = 'gif'; // GIF
                    
                    const filename = `${sticker.name.replace(/[^a-zA-Z0-9]/g, '_')}_${sticker.id}.${extension}`;
                    const url = sticker.url;
                    const filePath = path.join(STICKER_DIR, filename);
                    
                    // Skip Lottie stickers for now as they require special handling
                    if (sticker.format === 3) {
                        console.log(`Skipping Lottie sticker: ${sticker.name}`);
                        continue;
                    }
                    
                    const result = await downloadFile(url, filename);
                    
                    if (!USE_BASE64) {
                        fs.writeFileSync(filePath, result.buffer);
                    }
                    
                    const stickerData = {
                        id: sticker.id,
                        name: sticker.name,
                        description: sticker.description || '',
                        filename: filename,
                        format: sticker.format,
                        formatType: ['PNG', 'APNG', 'LOTTIE', 'GIF'][sticker.format - 1],
                        tags: sticker.tags || [],
                        index: stickerIndex
                    };
                    
                    if (USE_BASE64) {
                        stickerData.dataUrl = result.dataUrl;
                    }
                    
                    stickerManifest.stickers.push(stickerData);
                    stickerIndex++;
                } catch (error) {
                    console.error(`Failed to download sticker ${sticker.name}: ${error.message}`);
                }
            }
        } catch (error) {
            console.log('Could not fetch stickers:', error.message);
        }
        
        // Save sticker manifest
        fs.writeFileSync(
            path.join(STICKER_DIR, 'manifest.json'),
            JSON.stringify(stickerManifest, null, 2)
        );
        console.log(`Sticker manifest saved with ${stickerManifest.stickers.length} stickers!`);

        // Disconnect client
        client.destroy();
        
        console.log('\n✅ Done! Assets saved to:');
        console.log(`- Emojis: ${EMOJI_DIR}`);
        console.log(`- Sounds: ${SOUND_DIR}`);
        console.log(`- Stickers: ${STICKER_DIR}`);
        
        if (USE_BASE64) {
            console.log('\n✨ Base64 mode enabled - assets embedded in manifest.json files');
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

// Run the script
fetchDiscordAssets();