# Discord Bot Setup Guide

This guide will help you set up a Discord bot to fetch emojis from your server.

## Step 1: Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give your application a name (e.g., "Emoji Tetris Bot")
4. Click "Create"

## Step 2: Create a Bot

1. In your application, go to the "Bot" section in the left sidebar
2. Click "Add Bot"
3. Click "Yes, do it!"

## Step 3: Get Your Bot Token

1. In the Bot section, find the "TOKEN" section
2. Click "Copy" to copy your bot token
3. Add this token to your `.env` file as `DISCORD_BOT_TOKEN`

⚠️ **IMPORTANT**: Never share your bot token publicly!

## Step 4: Get Your Server (Guild) ID

1. Open Discord
2. Go to User Settings → Advanced
3. Enable "Developer Mode"
4. Right-click on your server name
5. Click "Copy ID"
6. Add this ID to your `.env` file as `DISCORD_GUILD_ID`

## Step 5: Invite Bot to Your Server

1. In the Discord Developer Portal, go to your application
2. Go to "OAuth2" → "URL Generator" in the left sidebar
3. Under "Scopes", select:
   - `bot`
4. Under "Bot Permissions", select:
   - `Read Messages/View Channels`
   - `Use External Emojis` (optional but recommended)
5. Copy the generated URL at the bottom
6. Open the URL in your browser
7. Select your server and click "Authorize"

## Alternative: Quick Invite Link

You can also use this template (replace YOUR_CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1073741824&scope=bot
```

To find your Client ID:
1. Go to your application in Discord Developer Portal
2. Go to "OAuth2" → "General"
3. Copy the "CLIENT ID"

## Troubleshooting

### "Unknown Guild" Error
- Make sure the bot is in your server (follow Step 5)
- Verify the Guild ID is correct
- Ensure the bot has permission to view the server

### "Invalid Token" Error
- Double-check your bot token in the `.env` file
- Make sure there are no extra spaces or quotes around the token
- Regenerate the token if needed (Bot section → Reset Token)

### Bot Can't See Emojis
- Ensure the bot has "Use External Emojis" permission
- Check that your server has custom emojis uploaded

## Verifying Setup

Run the emoji fetcher:
```bash
npm run fetch-emojis
```

The script will now:
1. List all servers the bot has access to
2. Show which Guild ID it's trying to fetch
3. Display helpful error messages if something goes wrong