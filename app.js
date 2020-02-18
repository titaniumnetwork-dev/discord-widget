const config = require("./config.json");
const colors = require('colors');
const request = require('request');
const express = require('express');
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const Discord = require("discord.js");
const client = new Discord.Client();
const bot = new Discord.Client({disableEveryone: true});
const fs = require('fs');
const bodyParser = require("body-parser");
const sanitizeHtml = require('sanitize-html');
const SocketAntiSpam  = require('socket-anti-spam')
var messageSending = true;
var killSwitch = false;
var last50={};
var chanName;
var channel=config.channel;
var wh1=config.webhookid1;
var wh2=config.webhookid2;
var wh3=config.webhookid3;
var blacklist={blacklist:['.tk','.cf','.ga','.gq','.ml','.dev','.com','.net','.org','.tech','.io','http://','https://','dot','nigg']};
var ipbanned={banned: []};
var logtochannelid="677309675485528078";
const socketAntiSpam = new SocketAntiSpam({
	banTime:            30,
	kickThreshold:      2,
	kickTimesBeforeBan: 1,
	banning:            true,
	io:                 io
})
socketAntiSpam.event.on('ban', data => {
		const date=new Date();
		console.log(`${date}`.black.bgRed+` Spam score of 3`.red)
		
})
bot.on(`ready`, async yeet => {
	//var last50={};
	bot.user.setStatus(`dnd`);
	bot.channels.fetch(channel).then(channel => { channel.messages.fetch({ limit: 50 }).then(messages => {
		last50 = messages.array().reverse(); // you get the array of messages
		console.log('Fetched last 50 messages'.black.bgYellow);
	})});
	bot.channels.fetch(channel).then(channel => { channel.messages.fetch({ limit: 50 }).then(messages => {
		let arr = messages.array().reverse(); // you get the array of messages
		last50=arr;
	})});
});

bot.on("message", async message => {
	if(message.channel.type === "dm" || !message.member) return;
	var args = message.content.split(' ');
	var staff=message.member.roles.cache.find(r => r.name === "Staff");
	var trusted=message.member.roles.cache.find(r => r.name === "Trusted");
	
	if(!killSwitch){
		bot.channels.fetch(channel).then(channel => { channel.messages.fetch({ limit: 50 }).then(messages => {
			let arr = messages.array().reverse();
			last50=arr;
		})});
		if(args[0].toLowerCase()==='-setchannel'){
			if(staff){
				message.guild.fetchWebhooks().then(webhooks => {
				var num=3
				var ee=0
				webhooks.forEach(webhook => {
					if(webhook['name']=='Chat Parser'){
						ee=ee+1;
						fs.readFile('config.json', function (err, data) {
							var json = JSON.parse(data)
							json[`webhookid${ee}`]=`https://discordapp.com/api/webhooks/${webhook.id}/${webhook.token}`;
							fs.writeFile("config.json", JSON.stringify(json),function(err){ if (err) throw err;})
						});
						num=num-1;
						console.log(webhook['name']+' '+webhook['id'])
						webhook.edit({name: 'Chat Parser', channel: message.channel});
					}
				});
				var i;
				for (i = 0; i < num; i++) {
					console.log('webhook is missing')
					message.channel.createWebhook('Chat Parser')
					fs.readFile('config.json', function (err, data) {
						var json = JSON.parse(data)
						json[`webhookid${i}`]=`https://discordapp.com/api/webhooks/${webhook.id}/${webhook.token}`;
						fs.writeFile("config.json", JSON.stringify(json),function(err){ if (err) throw err;})
					});
				}
				});
				
				fs.readFile('config.json', function (err, data) {
					var json = JSON.parse(data)
					json["channel"]=message.channel.id;
					fs.writeFile("config.json", JSON.stringify(json),function(err){ if (err) throw err;})
				});
				channel=message.channel.id;
				message.reply('OK, channel set to: `#'+message.channel.name+'`.').then(msg => {msg.delete({ timeout: 2000 })});
				io.sockets.emit('channelName',{ chanName: '#'+message.channel.name });
			}
			message.delete();
		}
		if(args[0].toLowerCase()==='-togglechat'){
			if(killSwitch==true)return;
			if(trusted || staff){
				messageSending=!messageSending;
				io.sockets.emit('permsChange',{ chanName: message.channel.name, messageSending: messageSending });
				message.channel.send('OK, messageSending set to: `'+messageSending.toString()+'`.');
			}
		}}
	if(args[0].toLowerCase()==='-ipban'){
		if(staff){
			message.channel.send('OK, IP will be banned.');
			fs.readFile('banned.json', function (err, data) {
				var json = JSON.parse(data)
				var args1=args[1]
				json.banned.push(args1)
				fs.writeFile("banned.json", JSON.stringify(json),function(err){ if (err) throw err;})
			});
		}
	}
	if(args[0].toLowerCase()==='-killswitch'){
		if(staff){
			killSwitch=!killSwitch;
			message.channel.send('OK, killSwitch set to: `'+killSwitch.toString()+'`.');
		}
	}
});

bot.login(config.token);
http.listen(8080, function(){
	console.clear()
	console.log('Listening on port 8080'.black.bgCyan);
});

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

function colorToHexString(dColor) {
    return '#' + ("000000" + (((dColor & 0xFF) << 16) + (dColor & 0xFF00) + ((dColor >> 16) & 0xFF)).toString(16)).slice(-6);
}

function msgHandle(message){
	if(killSwitch==true)return;
	if(message.channel.id!==channel)return;
	//|| message.content.length===0)return;
	var d=new Date(message.createdTimestamp)
	var date = d.getUTCDate();
	var args = message.content.split(' ');
	var month = d.getUTCMonth() + 1;
	var year = d.getUTCFullYear().toString().substring(2, 4);
	var dateStr = month + "/" + date + "/" + year;
	var username=sanitizeHtml(message.author.username)
	if(message.member){ username=sanitizeHtml(message.member.displayName) }
	var member = message.mentions.members.first();
	var dosend,pingstr,botstr,authorid,embedStr;
	if(message.member){
		var color=message.member.roles.highest.hexColor;
		if(color=="#000000"){
			color="#ffffff"
		}
		
	}
	if(typeof message.attachments.first() != 'undefined'){
		var attachment=message.attachments.first()
		/*console.log(JSON.stringify(message.attachments.first()))
		console.log(message.attachments.first()['attachment'])*/
		embedStr='<img style="vertical-align: initial; max-width: 50rem; max-height: 25rem; width:'+attachment['width']+'px; height:'+attachment['height']+'px" src="'+attachment['attachment']+'"></img>'
	} else {
		embedStr=""
	}
	authorid=message.author.id;
	dosend = pingstr = botstr = "";
	if(typeof member != "undefined"){
		if(typeof member.username != "undefined"){
			pingstr=`<span class="mention">@`+sanitizeHtml(member.username)+`&nbsp;</span>`;
		} else {
			pingstr=`<span class="mention">@`+sanitizeHtml(member.displayName)+`&nbsp;</span>`;
		}
	}
	if(message.author.bot){
		botstr=`<span class="bot">BOT</span>&nbsp;`;
	}
	var oldURL=message.author.avatarURL;
	var avatarURL="https://bibles.ml/login/?cdURL="+message.author.displayAvatarURL().replace('2048','40').replace('.gif','.gif?size=40').replace('.webp','.webp?size=40');
	if (avatarURL==="https://bibles.ml/login/?cdURL=null?size=40")avatarURL="./default1.png";
	io.sockets.emit('broadcast',{ embed:embedStr, color:color, authorid:authorid, content:sanitizeHtml(message.content), dateStr: dateStr, pingstr: pingstr, timestamp: message.createdTimestamp, botstr: botstr, username: username, avatar: avatarURL, date: message.createdTimestamp, chanName: "notchannelname" });
}

app.get('/', (req, res) => {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.sendFile(path.join(__dirname + '/public/discord.html'));
});

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

function cleanString(input) {
    var output = "";
    for (var i=0; i<input.length; i++) {
        if (input.charCodeAt(i) <= 127) {
            output += input.charAt(i);
        }
    }
	output=output.trim().replace(regex,"").replace(/[\u{0080}-\u{FFFF}]/gu, "").replace(/[\x00-\x1F\x80-\xFF]/,"").replace('@everyone','').replace('@here','').substr(0,128);
	var regex = /([^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFC\u{10000}-\u{10FFFF}])/ug;
	regex += /([\x7F-\x84]|[\x86-\x9F]|[\uFDD0-\uFDEF]|[\u{1FFFE}-\u{1FFFF}]|[\u{2FFFE}-\u{2FFFF}]|[\u{3FFFE}-\u{3FFFF}]|[\u{4FFFE}-\u{4FFFF}]|[\u{5FFFE}-\u{5FFFF}]|[\u{6FFFE}-\u{6FFFF}]|[\u{7FFFE}-\u{7FFFF}]|[\u{8FFFE}-\u{8FFFF}]|[\u{9FFFE}-\u{9FFFF}]|[\u{AFFFE}-\u{AFFFF}]|[\u{BFFFE}-\u{BFFFF}]|[\u{CFFFE}-\u{CFFFF}]|[\u{DFFFE}-\u{DFFFF}]|[\u{EFFFE}-\u{EFFFF}]|[\u{FFFFE}-\u{FFFFF}]|[\u{10FFFE}-\u{10FFFF}].)/ug;
	blacklist.blacklist.forEach(element => {
		if(output.toLowerCase().replace(' ','').includes(element)){
			output="[REDACTED]"
		}
	});
    return output
}

io.on('connection', function(socket){
	if(killSwitch==true)return;
	var chan=bot.channels.fetch(channel)
	async function yes(){
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
	yes();
	bot.channels.fetch(channel).then(yee => { chanName=yee.name });
	const datee=new Date(); 
	var sHeaders = socket.handshake.headers;
	var IP=socket['ip'];
	if(typeof IP == 'undefined')return;
	if(IP.split(',')[0].length>16){
		IP=IP.split(',')[1].trim();
	} else {
		IP=(sHeaders['x-forwarded-for'] || sHeaders['x-client-ip'] || socket.connection.remoteAddress || '').split(',')[0].trim();
	}
	fs.appendFile("logs.txt", `\n${datee}`+' '+IP.toString()+` Connected to socket`,function(err){ if (err) throw err;})
	console.log(`${datee}`.black.bgCyan+' '+IP.toString().black.bgGreen+` Connected to socket`)
	
	io.sockets.emit('channelName',{ chanName: chanName });
	io.sockets.emit('permsChange',{ chanName: chanName, messageSending: messageSending });
	
	socket.on('webhooksend', function(data){
		if(killSwitch==true)return;
		var avat='https://pro.bibles.ml/default'+data.avatar+'.png';
		var webhookid=[config.webhookid1,config.webhookid2,config.webhookid3,config.webhookid1,config.webhookid2];
		var url=webhookid[data.avatar];
		var address = IP.toString()
		var date=new Date();
		var username = cleanString(data.username)
		var content = cleanString(data.content);
		var c='```';
		var logstr=`${address} Banned: ${data.banned} <${data.username}> ${data.content.substring(0,128)}`;
		var conlogstr=`${date}`.black.bgCyan+` `+address.black.bgGreen+` `+`Banned: ${data.banned}`.black.bgYellow+` <${data.username}> ${data.content.substring(0,128)}`;
		console.log(conlogstr);
		fs.appendFile("logs.txt", `\n${date}`+logstr,function(err){ if (err) throw err;})
		if(config.logchannel=="true"){bot.channels.fetch(logtochannelid).then(channel => channel.send(`${c}`+logstr+`${c}`))}
		if(sHeaders['CF-Real-IP']){ //if(IP.toString().substring(0, 6)=='172.68'){
			IP=sHeaders['CF-Real-IP'];
			console.log('CloudFlare IP detected, using CF-Real-IP..')
		}
		fs.readFile('banned.json', function (err, dataa) {
			var banned
			if (err) console.log(err);
			JSON.parse(dataa).banned.forEach(yes => {
				if(IP.toString().startsWith(yes)){
					banned=true;
					return;
				}
			});
			if(banned==true || data.banned==="true"){
				io.sockets.emit('banned');
				socket.disconnect();
				if(config.logchannel=="true"){bot.channels.fetch(logtochannelid).then(channel => channel.send(`${c}${address} Banned: ${data.banned} <${username}> failed to send${c}`))}
				return;
			} else {
				if(!messageSending)return;
				request.post(url, {
					json: {
						"username": username,
						"avatar_url": avat,
						"content": content
				}
			});
			}
		});
		
	});
	for (let i = 0; i < last50.length; i++) {
		msgHandle(last50[i])
	}
	bot.on("message", msgHandle);
	socket.on('disconnect', function() {
		const date=new Date();
		socket.removeListener('connection', msgHandle);
	});
});