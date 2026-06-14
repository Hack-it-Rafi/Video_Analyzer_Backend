# Telegram Bot Integration for Video Analysis

## 🤖 Overview

This Telegram bot allows users to upload videos directly through Telegram and receive AI-powered analysis results instantly in their chat.

## 🚀 Features

- **Video Upload**: Send MP4 videos directly to the bot
- **Automatic Processing**: AI analysis happens in the background
- **Real-time Notifications**: Get notified when processing completes
- **Results in Chat**: First 10 predictions sent directly to Telegram
- **Status Tracking**: Check processing status anytime with `/status` command

## 📋 Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "Video Analysis Bot")
4. Choose a username (must end with 'bot', e.g., "my_video_analysis_bot")
5. BotFather will give you a **bot token** like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Configure Environment Variables

Add the following to your `.env` file in the Backend folder:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
FRONTEND_URL=http://localhost:5173
```

### 3. Start Your Backend Server

```bash
cd Backend
npm run dev
```

You should see:

```
✅ Telegram bot started successfully
```

### 4. Test the Bot

1. Open Telegram and search for your bot username
2. Send `/start` to begin
3. Upload an MP4 video file
4. Wait for processing (you'll get notifications)
5. Receive analysis results!

## 💬 Bot Commands

- `/start` - Welcome message and instructions
- `/help` - How to use the bot
- `/status` - Check if you have a video processing

## 📤 How to Upload Videos

1. Open your bot in Telegram
2. Click the attachment icon (📎)
3. Select "File" or "Gallery"
4. Choose your MP4 video
5. Send it to the bot
6. Wait for the analysis results!

## ⚠️ Limitations

- **File Size**: Maximum 50MB (Telegram API limit)
- **Format**: MP4 only
- **Concurrent Uploads**: One video per user at a time
- **Processing Time**: 5-15 minutes depending on video length

## 📊 What You'll Receive

After processing completes, the bot sends:

1. **Video Information**
   - Duration
   - Total chunks analyzed

2. **Summary Statistics**
   - Most common application
   - Most common action
   - Average confidence scores

3. **Activity Timeline**
   - First 10 detected activities
   - Time ranges
   - App names with confidence
   - Actions with confidence

4. **Web Link**
   - Link to view full results in web interface

## 🔧 Troubleshooting

### Bot doesn't respond

- Check if backend server is running
- Verify `TELEGRAM_BOT_TOKEN` is correct in `.env`
- Check console for error messages

### "Video file is too large"

- Compress your video to under 50MB
- Or use the web interface for larger files

### Processing takes too long

- Videos are processed in real-time
- Longer videos = longer processing time
- You'll be notified when complete

## 🌐 Web Interface Alternative

For videos larger than 50MB or if you prefer a web interface:

- Visit: http://localhost:5173
- Login to your account
- Use the "Upload New Video" button

## 🎯 Example Usage

```
User: [Sends video file]
Bot: 📥 Downloading your video...
Bot: ✅ Video uploaded successfully!
     Video ID: 6999c2c4a4ae57f089525d19
     Processing has started...
     ⏱️ Estimated time: 5-15 minutes

[After processing...]

Bot: ✅ Video Analysis Complete!

📹 Video Information
Duration: 19m 48s
Total Chunks: 397

📊 Summary
Most Common App: `notepad`
Most Common Action: `browser:explore_url`
Avg App Confidence: 49.5%
Avg Action Confidence: 61.7%

🎯 First 10 Activities

1. 0s-3s
   App: `editor` (23.8%)
   Action: `app:switch` (50.5%)

2. 3s-6s
   App: `browser` (45.2%)
   Action: `browser:explore_url` (72.3%)

... and 387 more activities

💡 View full results at: http://localhost:5173/videos
```

## 🔐 Security Notes

- Bot token should be kept secret (never commit to git)
- Videos from Telegram users are stored with `user: null` (no authentication required)
- All videos are stored in MinIO with secure access

## 📝 Notes

- The bot uses the same backend infrastructure as the web app
- All videos are processed through the same AI prediction service
- Results are stored in the database and accessible via web interface
- Chat ID is stored with the video for tracking purposes

## 🆘 Support

If you encounter any issues:

1. Check backend console logs
2. Verify all environment variables are set
3. Ensure the prediction service (port 5000) is running
4. Test with a small video first (< 5MB)

---

Made with ❤️ for easy video analysis through Telegram
