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
		console.log('Fetched last 50 messages'.black.bgCyan);
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
	var name=message.author.username;
	bot.channels.get(config.channel).fetchMessages({ limit: 50 }).then(messages => {
		let arr = messages.array().reverse(); // you get the array of messages
		last50=arr;
	});
});

bot.login(config.token);

const colors = require('colors');
const request = require('request');
var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');

http.listen(8080, function(){
  console.log('Listening on port 8080'.black.bgCyan);
});

//const server = app.listen(8080, () => console.log(`Express running → PORT ${server.address().port}`));
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

function msgHandle(message){
	if(message.channel.id!==config.channel)return;
	var curr = message;
	var d=new Date(curr.createdTimestamp)
	var date = d.getUTCDate();
	var args = curr.content.split(' ');
	var month = d.getUTCMonth() + 1; // Since getUTCMonth() returns month from 0-11 not 1-12
	var year = d.getUTCFullYear().toString().substring(2, 4);
	var dateStr = month + "/" + date + "/" + year;
	var username=sanitizeHtml(curr.author.username)
	var member = curr.mentions.members.first() || curr.guild.members.get(args[0]);
	var dosend="";
	var pingstr="";
	if(typeof member !== "undefined"){
		pingstr=`<span class="mention">@`+sanitizeHtml(member.user.username)+`&nbsp;</span>`;
	}
	var botstr="";
	if(message.author.bot){
		botstr=`<span class="bot">BOT</span>&nbsp;`;
	}
	var avatarURL="https://bibles.ml/login/?cdURL="+curr.author.avatarURL+"?size=128";
	if (avatarURL==="https://bibles.ml/login/?cdURL=null?size=128")avatarURL="https://bibles.ml/login/?cdURL=https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png";
	dosend+=`
	<div class='message'><img src="`+avatarURL+`" class="avatar"></img>
	<span class="name" onclick="document.getElementsByClassName('input')[0].value='<@`+curr.author.id+`>'"  userid="`+curr.author.id+`">`+sanitizeHtml(curr.author.username )+`</span>`+botstr+`
	<time class="timestamp" datetime="`+curr.createdTimestamp+`">
	<span aria-label="&nbsp;&nbsp;`+dateStr+`">&nbsp;&nbsp;`+dateStr+`</span></time>
	<span class="content"><p class="contentp">`+pingstr+sanitizeHtml(curr.content)+`</p></span></div><hr class="discord">`;
	io.sockets.emit('broadcast',{ html: dosend, date: curr.createdTimestamp });
}

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/public/discord.html'));
});
io.on('connection', function(socket){
	const datee=new Date();
	console.log(`${datee}`.black.bgCyan+` Connected to socket`)
	socket.on('webhooksend', function(data){
		request.post(config.webhookid, {
		  json: {
			"username": data.username,
			"content": data.content
		  }
		});
	});
	for (let i = 0; i < last50.length; i++) { // you loop through them
		msgHandle(last50[i])
	}
	bot.on("message", msgHandle);
	socket.on('disconnect', function() {
		const date=new Date();
		socket.removeListener('connection', msgHandle);
		console.log(`${date}`.black.bgCyan+` Disconnected from socket`)
	});
});