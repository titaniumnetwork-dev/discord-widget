const config = require("./config.json");
const Discord = require("discord.js");
const client = new Discord.Client();
const bot = new Discord.Client({disableEveryone: true});
const fs = require('fs');
const bodyParser = require("body-parser");
const sanitizeHtml = require('sanitize-html');
require('events').EventEmitter.defaultMaxListeners = 15;
last50={};
bot.on(`ready`, async yeet => {
	//var last50={};
	bot.user.setStatus(`dnd`);
	bot.channels.get(config.channel).fetchMessages({ limit: 50 }).then(messages => {
		last50 = messages.array().reverse(); // you get the array of messages
		console.log('Fetched last 50 messages');
	});
	bot.channels.get(config.channel).fetchMessages({ limit: 50 }).then(messages => {
		let arr = messages.array().reverse(); // you get the array of messages
		last50=arr;
	});
});

bot.on("message", async message => {
	if(message.channel.type === "dm") return;
	let messageArray = message.content.split(" ");
	let msg = messageArray[0];
	var args = message.content.split(' ');
	var name=message.author.username
	var logtext='<p>[ '+message.author.username+' ]: '+ msg + '</p>\n';
	bot.channels.get(config.channel).fetchMessages({ limit: 50 }).then(messages => {
		let arr = messages.array().reverse(); // you get the array of messages
		last50=arr;
	});
});

bot.login(config.token);

const express = require('express');
const app = express();
const server = app.listen(8080, () => console.log(`Express running → PORT ${server.address().port}`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(
  bodyParser.urlencoded({
    extended: true
  })
)
var http = require('http');
app.use(bodyParser.json())
app.get('/', (req, res) => {
	tosend=``;
	for (let i = 0; i < last50.length; i++) { // you loop through them
		var curr = last50[i];
		var username=sanitizeHtml(curr.author.username);
		var d=new Date(curr.createdTimestamp)
		var date = d.getUTCDate();
		var args = curr.content.split(' ');
		var month = d.getUTCMonth() + 1; // Since getUTCMonth() returns month from 0-11 not 1-12
		var year = d.getUTCFullYear().toString().substring(2, 4);
		var pingstr=""
		var member = curr.mentions.members.first() || curr.guild.members.get(args[0]);
		if(typeof member !== "undefined"){
			pingstr=`<span class="mention">@`+sanitizeHtml(member.user.username)+`&nbsp;&nbsp;</span>`;
		}
		var botstr="";
		if(curr.author.bot){
			botstr=`&nbsp&nbsp<span class="bot">BOT</span>&nbsp;`;
		}
		var dateStr = month + "/" + date + "/" + year;
		var avatarURL="https://bibles.ml/login/?cdURL="+curr.author.avatarURL+"?size=128";
		if (avatarURL==="https://bibles.ml/login/?cdURL=null?size=128")avatarURL="https://bibles.ml/login/?cdURL=https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png";
		tosend+=`
		<div class="message">
		<img src="`+avatarURL+`" class="avatar"></img>
		<span class="name" onclick="document.getElementsByClassName('input')[0].value='<@`+curr.author.id+`>'"  userid="`+curr.author.id+`">`+sanitizeHtml(curr.author.username )+`</span>
		<span class="content">`+pingstr+sanitizeHtml(curr.content)+`</span>`+botstr+`
		<time class="timestamp" datetime="`+curr.createdTimestamp+`">
		<span aria-label="&nbsp;&nbsp;`+dateStr+`">&nbsp;&nbsp;`+dateStr+`</span></time>
		</div><hr class="discord">`;
	}
	var content;
	fs.readFile('./public/discord.html', function read(err, data) {
		if (err) {
			throw err;
		}
		content = data;
		processFile();
	});

	function processFile() {
		res.write(content);
		res.write(tosend);
		res.write(`
		<script>
		document.write('<div class="spacebottom"></div>');
		var d = document.getElementsByClassName('spacebottom')[0];
		d.parentNode.appendChild(d); 
		window.scrollTo(0,document.body.scrollHeight);</script>`);
	}
	bot.on("message", async message => {
		var curr = message;
		var dosend="";
		var d=new Date(curr.createdTimestamp)
		var date = d.getUTCDate();
		var args = curr.content.split(' ');
		var month = d.getUTCMonth() + 1; // Since getUTCMonth() returns month from 0-11 not 1-12
		var year = d.getUTCFullYear().toString().substring(2, 4);
		var dateStr = month + "/" + date + "/" + year;
		var username=sanitizeHtml(curr.author.username)
		var member = curr.mentions.members.first() || curr.guild.members.get(args[0]);
		if(typeof member !== "undefined"){
			pingstr=`<span class="mention">@`+sanitizeHtml(member.user.username)+`&nbsp;</span>`;
		}
		var botstr="";
		if(message.author.bot){
			botstr=`&nbsp&nbsp<span class="bot">BOT</span>&nbsp;`;
		}
		var avatarURL="https://bibles.ml/login/?cdURL="+curr.author.avatarURL+"?size=128";
		if (avatarURL==="https://bibles.ml/login/?cdURL=null?size=128")avatarURL="https://bibles.ml/login/?cdURL=https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png";
		dosend+=`
		<div class="message">
		<img src="`+avatarURL+`" class="avatar"></img>
		<span class="name" onclick="document.getElementsByClassName('input')[0].value='<@`+curr.author.id+`>'"  userid="`+curr.author.id+`">`+sanitizeHtml(curr.author.username )+`</span>
		<span class="content">`+pingstr+sanitizeHtml(curr.content)+`</span>`+botstr+`
		<time class="timestamp" datetime="`+curr.createdTimestamp+`">
		<span aria-label="&nbsp;&nbsp;`+dateStr+`">&nbsp;&nbsp;`+dateStr+`</span></time>
		</div><hr class="discord"><script>
		var d = document.getElementsByClassName('spacebottom')[0];
		d.parentNode.appendChild(d); 
		window.scrollTo(0,document.body.scrollHeight);</script>`;
		res.write(dosend);
	});
});