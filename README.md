# discord-proxy
Node.js app that runs a Discord.js bot

Maintained by Divide#3223 on discord
__If you spot an issue, bug, or a feature you want added then you can help by adding a new issue in the issues tab__
Contributions are greatly appreciated. as this is very early in development

## Todo List
### High priority
- ~~Text wrapping~~ Fixed 
- ~~Make wrapped content push other messages down~~ Fixed
- ~~Whatever the fuck causes the messages to get all wonky~~ Fixed
- Choosing a selection of webhooks to prevent timeouts from spammers
- Message delays
- Image attachment support
### Normal priority
- ~~Add websocket support~~ Websockets added
- Emojis
- ~~Displaying emojis~~ Already shows as unicode
### Low priority
- ~~Obfuscating webhooks~~ Fixed with websockets 
- ~~Proxying POST requests for sending messages~~ Fixed with websockets
- Better HTML sanitizing (added because of YOCT)

## How do I deploy this?
1. Visit https://discordapp.com/developers/applications/
2. Press "New Application" and name it to whatever (e.g. "Swag Message Assistant")
3. Switch to the bot tab and press "Add Bot"
4. Press "Copy" under the blue text that says "Click to Reveal Token"
5. Download the discord-proxy repository and extract to a folder
6. Open up "config.json" with a text editor and in the token field, select the text "insert bot token" and paste your copied token then save the file
6. Run "cmd.exe" or "command prompt" and navigate to the folder with the "cd" command
7. Make sure "node.js" and "npm" are both installed on your platform
8. Run "npm install"
9. Open up the "config.json" file once more and in Discord go in settings and under appearance you will find at the bottom "Developer Mode", make sure that is toggled on and if not toggle it. Go to the server you desire to test on and right click any channel and press "Copy ID" and select in the "config.json" file the channel field and replace the big numbers with your clipboard by pasting it into there and save the file
10. In the discord developer website navigate to your bot and in the "general information" tab select "Copy" under the text "CLIENT ID" and visit 
https://discordapp.com/oauth2/authorize?client_id=PasteyourCLIENTIDhere&scope=bot&permissions=346112
and replace the "Paste your CLIENT ID" with your clipboard by selecting it and pasting it there.
11. In the command prompt window type in "node app.js" and visit http://localhost:8080/ in your browser
I hope this wasn't too complicated and if I missed any steps let me know.
## Basic rundown
This app uses discord.js to fetch the last 50 messages and output it via HTMl. The outputted HTMl gets formatted to appear like Discord so it doesnt feel wonky then the messages send on the page are send via webhooks to make the message appear. ~~The page never finishes loading at the moment that way new message requests can be sent (this might change).~~ Websockets are used to make messages appear or send to a webhook and to request messages
