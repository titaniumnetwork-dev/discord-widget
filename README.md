# discord-proxy
Node.js app that runs a Discord.js bot

Maintained by gamering#3223 on discord
__If you spot an issue, bug, or a feature you want added then you can help by adding a new issue in the issues tab__
Contributions are greatly appreciated. as this is very early in development

## Todo List
### High priority
- optimize client bans
- make config more dynamic
### Normal priority
- Members list
### Low priority
- Multiple channel support

## How do I deploy this?
1. Visit https://discordapp.com/developers/applications/
2. Press "New Application" and name it to whatever (e.g. "Swag Message Assistant")
3. Switch to the bot tab and press "Add Bot"
4. Press "Copy" under the blue text that says "Click to Reveal Token"
5. Download the discord-proxy repository and extract to a folder
6. Open up "config.json" with a text editor and in the token field, select the text "insert bot token" and paste your copied token then save the file
6. Open a terminal of any sort (CMD or Terminal) and navigate to your folder with app.js in it using the "cd" command
7. Make sure "node.js" and "npm" are both installed on your platform
8. Run "npm install"
9. Open up the "config.json" file once more and in Discord go in settings and under appearance you will find at the bottom "Developer Mode", make sure that is toggled on and if not toggle it. Go to the server you desire to test on and right click any channel and press "Copy ID" and select in the "config.json" file the channel field and replace the big numbers with your clipboard by pasting it into there and save the file
10. In the discord developer website navigate to your bot and in the "general information" tab select "Copy" under the text "CLIENT ID" and visit https://breadsticks.ga/chatparser/ then paste the client ID into the box that says "CLIENT ID" then press "Generate" and click on the link and select a server  to invite it to.
12. Go to your channel you got your channel id from and press the gears icon on it and go to the Webhooks tab. Click on create webhook and fill in some details and click on "Copy" after the webhook url box. In the config.json file paste this link in the field that says "Insert webhook id 1 here"
13. Repeat the previous step until the fields that say "Insert webhook id # here" are all filled out and are set to general which would be about 3 times.
14. Save all changes to config.json.
11. In a terminal type in "node app.js" and visit http://localhost:8080/ in your browser
## Basic rundown
This node app fetches a set of messages in a channel and sends it to the clients to read them and the clients can send a message to the server that will be filtered then the server will fire a webhook with the data to send a message.
