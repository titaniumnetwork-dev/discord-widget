# discord-proxy
Node.js app that runs a Discord.js bot

__If you spot an issue, bug, or a feature you want added then you can help by adding a new issue in the issues tab__
Contributions are greatly appreciated. as this is very early in development

## Todo List
### High priority
- Text wrapping
- Choosing a selection of webhooks to prevent timeouts from spammers
- Message delays
- Image attachment support
### Normal priority
- Emojis
- Displaying emojis
- Better HTML sanitizing (added because of YOCT)
### Low priority
- Obfuscating webhooks
- Proxying POST requests for sending messages

## Basic rundown
This app uses discord.js to fetch the last 50 messages and output it via html. The app also runs an index.html file that contains formatting for each message and each message gets parsed and configured so it displays nicely.
