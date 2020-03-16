const config = require("./config.json"),
	colors = require('colors'),
	request = require('request'),
	express = require('express'),
	app = require('express')(),
	http = require('http').createServer(app),
	io = require('socket.io')(http),
	path = require('path'),
	Discord = require("discord.js"),
	client = new Discord.Client(),
	bot = new Discord.Client({disableEveryone: true}),
	fs = require('fs'),
	bodyParser = require("body-parser"),
	sanitizeHtml = require('sanitize-html'),
	SocketAntiSpam  = require('socket-anti-spam'),
	ip2proxy = require("ip2proxy-nodejs"),
	sleep = require('sleep'),
	blacklist=config['blacklist'],
	socketInfo=require('./modules/socketInfo.js'),
	startDate=new Date(),
	readline = require('readline'),
	rl=readline.createInterface({
		input: process.stdin,
		output: process.stdout
	}),
	socketAntiSpam = new SocketAntiSpam({
		banTime:            20,
		kickThreshold:      3,
		kickTimesBeforeBan: 2,
		banning:            true,
		io:                 io
	});
var messageSending = true,
	killSwitch = false,
	last50,
	chanName,
	channel=config.channel,
	wh1=config.webhookid1,
	wh2=config.webhookid2,
	wh3=config.webhookid3,
	ipbanned={banned: []},
	clientBans=config.clientBans
	logging=config.logging.value,
	loggingChannel=config.logging.channel,
	proxURL=config.imageproxy,
	helpername=config.helper,
	staffname=config.staff;

socketAntiSpam.event.on('ban', data => {
		var date=new Date();
		var IP=data.handshake.headers['cf-connecting-ip']; if(typeof IP == 'undefined')return;
		console.log(`${date} `+IP.black.bgGreen+` `+`Spam score of 3`.black.bgRed); //console.log(data);
});
function ask(){
	rl.question('', function(mts) {
		var cmd=mts;
		var args = cmd.split(' ');
		if(args[0].toLowerCase()==='-t'){
			bot.channels.fetch(channel).then(channelh => {
			channelh.startTyping();
				setTimeout(()=>{
					channelh.send(cmd.substr(args[0].length+1,128));
					channelh.stopTyping();
				},(mts.length*250))
			});
		} else if(args[0].toLowerCase()==='uptime'){
			console.log(getUptime());
		} else if(args[0].toLowerCase()==='togglechat'){
			messageSending=!messageSending;
			io.sockets.emit('permsChange',{ messageSending: messageSending });
			console.log('OK, messageSending set to: `'+messageSending.toString()+'`.');
		} else if(args[0].toLowerCase()==='-banlist'){
			fs.readFile('./banned.json', function (err, data) {
				var msg=""
				var json = JSON.parse(data)
				json.banned.forEach((e,i,a) => {
					msg+=`${e}, `;
				});
				console.log(msg);
			});	
		} else if(args[0].toLowerCase()==='killswitch'){
			killSwitch=!killSwitch; console.log(`OK, killSwitch set to: ${killSwitch.toString()}.`);
		} else {
			console.log('Unknown command. Check your spelling and try again.'.white.bgRed)
		}
		ask();
	});
}
bot.on(`ready`, async suck => {
	bot.user.setPresence({ activity: { type:'WATCHING', name: 'social transmissions' }, status: 'dnd' })
		.catch(err => console.log(err));
	bot.channels.fetch(channel).then(channel => { channel.messages.fetch({ limit: 50 }).then(messages => {
		let arr = messages.array().reverse();
		last50=arr;
	})});
	console.log('Fetched last 50 messages'.black.bgYellow);
	ip2proxy.Open("./IP2PROXY-LITE-PX2.BIN");
	ask();

});
function getUptime(){
	var ud=new Date(bot.uptime);
	var s=Math.round(ud.getSeconds());
	var m=Math.round(ud.getMinutes());
	var h=Math.round(ud.getUTCHours());
	return `UPTIME: ${h} hours, ${m} minutes, ${s} seconds`
}
function removeElement(array, elem) {
    var index = array.indexOf(elem);
    if (index > -1) {
        return array.splice(index+1, 1);
    }
}
bot.on("messageDelete", async message => {
	last50.forEach((e,i,a)=>{
		if(e.id=message.id){
			//a=removeElement(a,e) broken
		};
	});
	io.sockets.emit('messageDelete',{ msgID: message.id });
});
bot.on("message", async message => {
	if(message.channel.type === "dm")return;
	try { if(message.channel.id===channel){last50.push(message); last50.shift();}} catch(err) { console.log('failed to push last50') }
	if(!message.member)return;
	var args = message.content.split(' ');
	var staff=(message.member.roles.cache.find(r=>r.id==="491667301171462144") || message.member.hasPermission('MANAGE_MESSAGES') || message.member.roles.cache.find(r => r.name.toLowerCase() === staffname.toLowerCase()));
	var trusted=message.member.roles.cache.find(r => r.name.toLowerCase() === helpername.toLowerCase());
	if(!killSwitch){
		if(args[0].toLowerCase()==='-uptime'){
			message.channel.send(getUptime())
		}
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
							fs.writeFile("config.json", JSON.stringify(json),function(err){ if (err) console.log(err);})
						});
					}
				});
				fs.readFile('config.json', function (err, data) {
					var json = JSON.parse(data)
					json["channel"]=message.channel.id;
					fs.writeFile("config.json", JSON.stringify(json),function(err){ if (err) throw err;})
				});
				channel=message.channel.id;
				message.channel.send('OK, channel set to: `#'+message.channel.name+'`.').then(msg => {msg.delete({ timeout: 2000 })});
				io.sockets.emit('channelName',{ chanName: '#'+message.channel.name });
			}
			message.delete();
		}
		if(args[0].toLowerCase()==='-togglechat'){
			if(killSwitch==true)return;
			if(message.author.id==="635576642370142210" || trusted || staff){
				messageSending=!messageSending;
				io.sockets.emit('permsChange',{ chanName: message.channel.name, messageSending: messageSending });
				message.channel.send('OK, messageSending set to: `'+messageSending.toString()+'`.');
			}
		}
		if(args[0].toLowerCase()==='-clientbans'){
			if(killSwitch==true)return;
			if(message.author.id==="635576642370142210" || trusted || staff){
				clientBans=!clientBans;
				fs.readFile('config.json', function (err, data) {
					var json = JSON.parse(data)
					json.clientBans=clientBans;
					fs.writeFile("config.json", JSON.stringify(json),function(err){ if (err) throw err;})
				});
				message.delete();
				message.channel.send('OK, clientBans set to: `'+clientBans.toString()+'`.').then(msg => {msg.delete({ timeout: 2000 })});
			}
		}}
	if(args[0].toLowerCase()==='-ipban'){
		if(staff || message.author.id==="275757537327054848"){
			fs.readFile('./banned.json', function (err, data) {
				var json = JSON.parse(data)
				json.banned.push(args[1])
				fs.writeFile("./banned.json", JSON.stringify(json),function(err){ if (err) throw err;})
			});
			message.channel.send(`OK, IP **${args[1]}** will be banned.`);
		}
	}
	if(args[0].toLowerCase()==='-ipunban' || args[0].toLowerCase()==='+ipban'){
		if(staff || message.author.id==="275757537327054848"){
			fs.readFile('./banned.json', function (err, data) {
				var json = JSON.parse(data)
				json.banned.forEach((e,i,a) => {
					if(e===args[1]){
						json.banned.splice(i, 1); 
					}
				});
				fs.writeFile("./banned.json", JSON.stringify(json),function(err){ if (err) throw err;})
			});
			message.reply(`OK, IP **${args[1]}** will be unbanned.`);
		}
	}

	if(staff && args[0].toLowerCase()==='+helper'){
		fs.readFile('config.json', function (err, data) {
			var json = JSON.parse(data);
			json['helper']=args[1];
			fs.writeFile('config.json', JSON.stringify(json),function(err){ if (err) throw err;})
		}); helpername=args[1]; message.channel.send(`OK, role **${args[1]}** will be **added** to helper.`);
	}
	if(staff && args[0].toLowerCase()==='-helper'){
		fs.readFile('config.json', function (err, data) {
			var json = JSON.parse(data);
			if(args[1]==json['helper']){
				json['helper']="";
			}
			fs.writeFile('config.json', JSON.stringify(json),function(err){ if (err) throw err;})
		}); helpername=''; message.channel.send(`OK, role **${args[1]}** will be **removed** from helper.`);
	}

	if(staff && args[0].toLowerCase()==='+staff'){
		fs.readFile('config.json', function (err, data) {
			var json = JSON.parse(data);
			json['staff']=args[1];
			fs.writeFile('config.json', JSON.stringify(json),function(err){ if (err) throw err;})
		}); staffname=args[1]; message.channel.send(`OK, role **${args[1]}** will be **added** to staff.`);
	}
	if(staff && args[0].toLowerCase()==='-staff'){
		fs.readFile('config.json', function (err, data) {
			var json = JSON.parse(data);
			if(args[1]==json['staff']){
				json['staff']="";
			}
			fs.writeFile('config.json', JSON.stringify(json),function(err){ if (err) throw err;})
		}); staffname=''; message.channel.send(`OK, role **${args[1]}** will be **removed** from staff.`);
	}
	if(staff && args[0].toLowerCase()==='-t'){
		var mts=message.content.substr(2,128);
		message.delete();
		bot.channels.fetch(channel).then(channelh => {
        channelh.startTyping();
			setTimeout(()=>{
				channelh.send(mts);
				channelh.stopTyping();
			},(mts.length*250))
		});
	}
	if(args[0].toLowerCase()==='-banlist'){
		if(staff || message.author.id==="275757537327054848"){
			fs.readFile('./banned.json', function (err, data) {
				var msg=""
				var json = JSON.parse(data)
				json.banned.forEach((e,i,a) => {
					msg+='``'+e+'``, '
				});
				message.channel.send(msg);
			});	
		}
	}
	if(args[0].toLowerCase()==='-killswitch'){
		if(staff){ killSwitch=!killSwitch; message.channel.send('OK, killSwitch set to: `'+killSwitch.toString()+'`.'); }
	}
	if(args[0].toLowerCase()==='+purge'){
		if(staff || message.author.id==='361562864693149696'){//if(args[1]==='*'){message.channel.bulkDelete(fetched); return;}
			message.delete();
			var who = message.mentions.members.first();
			var fetched = await message.channel.messages.fetch({limit: Number(args[2])});
			fetched.array().forEach((e,i,a)=>{if(e.author=who.user){e.delete().catch(()=>console.log('Cannot purge messages from user, are they a webhook?'))}})
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
function msgHandle(message){
	if(killSwitch==true)return;
	if(message.channel.id!==channel)return;
	var d=new Date(message.createdTimestamp)
	var date = d.getUTCDate();
	var args = message.content.split(' ');
	var month = d.getUTCMonth() + 1;
	var content = sanitizeHtml(message.content);
	var parserRules = [
		{ pattern: /```js\n/, replacement: '```' },
		{ pattern: /```css\n/, replacement: '```' },
		{ pattern: /```html\n/, replacement: '```' },
		{ pattern: /```php\n/, replacement: '```' },
		{ pattern: /```([\s\S]*?)```/, replacement: '\n<pre><code>$1</code></pre>' }
	];
	parserRules.forEach(function(rule) {
		content = content.replace(rule.pattern, rule.replacement)
	});
	var year = d.getUTCFullYear().toString().substring(2, 4);
	var dateStr = month + "/" + date + "/" + year;
	var username=sanitizeHtml(message.author.username)
	if(message.member){ username=sanitizeHtml(message.member.displayName) }
	var member = message.mentions.members.first();
	var dosend,pingstr,botstr,authorid,embedStr;
	if(message.member){var color=message.member.roles.highest.hexColor;if(color=="#000000")color="#ffffff";}
	if(typeof message.attachments.first() != 'undefined'){
		var attachment=message.attachments.first()
		embedStr='<p class="contentp"><img style="vertical-align: initial; width:'+(Number(attachment['width'])*0.5)+'px; height:'+(Number(attachment['height'])*0.5)+'px" src="'+proxURL+attachment['attachment']+'"></img></p>'
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
	var avatarURL=proxURL+message.author.displayAvatarURL({"format":"webp","dynamic":"true","size":32});
	if (message.author.displayAvatarURL({"format":"webp","dynamic":"true","size":32}).includes('null'))avatarURL="./default1.png";
	io.sockets.emit('message',{ msgID:message.id, embed:embedStr, color:color, authorid:authorid, content:content, dateStr: dateStr, pingstr: pingstr, timestamp: message.createdTimestamp, botstr: botstr, username: username, avatar: avatarURL, date: message.createdTimestamp, chanName: "notchannelname" });
}
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
	blacklist.forEach((e,i,a)=>{
		if(!e.includes('gay') && output.toLowerCase().replace(' ','').includes(e)){
			output="[REDACTED]";
		}
	});
    return output
}

io.on('connection', function(socket){
	if(killSwitch==true)return;
	var chan=bot.channels.fetch(channel);
	var IP=socketInfo.getIP(socket);
	var ID=socketInfo.getID(socket);
	bot.channels.fetch(channel).then(yee => { chanName=yee.name });
	const datee=new Date(); 
	fs.appendFile("logs.txt", `\n${datee}`+' '+IP+` Connected to socket`,function(err){ if (err) throw err;})
	console.log(`${datee}`.black.bgCyan+' '+IP.black.bgGreen+` Connected to socket`)
	io.sockets.emit('permsChange',{ chanName: chanName, messageSending: messageSending });
	socket.on('webhooksend', send)
	function send(data){
		if(killSwitch==true || data.content.length<=0 || !messageSending)return;
		var avatardata=Number(data.avatar)-1,
			webhookid=[config.webhookid1,config.webhookid2,config.webhookid3,config.webhookid1,config.webhookid2],
			date=new Date(),
			username = `${ID}: ${cleanString(data.username)}`,
			content = cleanString(data.content),
			c='```',
			avat,
			logstr=`${IP} Banned: ${data.banned} <${data.username}> `;
		if(!avatardata>=0 || !avatardata<=4){avatardata=0};
		avat='https://pro.breadsticks.ga/default'+(avatardata+1)+'.png';
		url=webhookid[avatardata];
		if(data.banned!=="true")data.banned="false";
		console.log(`${date}`.black.bgCyan+` `+IP.black.bgGreen+` `+`Banned: ${data.banned}`.black.bgYellow+` <${data.username}> ${data.content.substring(0,128)}`);
		fs.appendFile("logs.txt", `\n${date}`+logstr,function(err){ if (err) throw err;})
		if(socket.handshake.headers['CF-Real-IP']){
			IP=socket.handshake.headers['CF-Real-IP'];
			console.log('CloudFlare IP detected, using CF-Real-IP..')
		}
		fs.readFile('./banned.json', function (err, dae) {
			fs.readFile('vpns.json', function (erre, daee) {
				var banned
				if(clientBans==true && data.banned=="true")banned=true;
				if (err) console.log(err);
				if(ip2proxy.isProxy(IP)==1){banned=true;};
				JSON.parse(daee).vpns.forEach(yes => {
					if(IP.startsWith(yes)){
						banned=true;
						return;
					}
				});
				JSON.parse(dae).banned.forEach(yes => {
					if(IP.startsWith(yes)){
						banned=true;
						return;
					}
				});
				if(banned!=true)banned=false;
				try{
					if(logging){bot.channels.fetch(loggingChannel).then(channel => {
						var log={
							author: { name: `${data.username}`, icon_url: `${avat}`},
							description: `${data.content.substring(0,128)}`,
							timestamp: new Date(),
							footer: {
								text: `IP: ${IP} • ID: ${ID} • Banned: ${banned}`
							},
						};
						logmsg=channel.send('`'+IP+'`', { embed: log });
					})}
				}
				catch{
					console.log('embed did an uh oh but i dont care')
				}
				if(banned==true){
					io.sockets.emit('banned');
					socket.disconnect();
					return;
				} else {
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
		
	}
	try {
		last50.slice(Math.max(last50.length - 50, 1)).forEach((e,i,a) => {
			if(i>=50)return;
			msgHandle(e)
		})
	}
	catch(err){
		console.log('last50 do not slice')
	}
	bot.on("message", msgHandle);
	socket.on('disconnect', function() {
		const date=new Date();
		socket.removeListener("webhooksend",function(){});
		socket.removeListener("connection",function(){});
	});
});
function extractHostname(url){var hostname;if (url.indexOf("//") > -1){hostname = url.split('/')[2]}else{hostname = url.split('/')[0];}hostname = hostname.split(':')[0];hostname = hostname.split('?')[0];return hostname.replace('www.','')}
var Unblocker;
try {
	Unblocker = require('unblocker');
}
catch(e) {
	var date=new Date();
	console.log(`${date}`.black.bgCyan+`Unblocker not work :(((`); //console.log(data);
	console.log(e);
}
var Transform = require('stream').Transform;

function userAgent(data){
	data.headers['user-agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36 OPR/12";
	return data
}
function log(data) {
	if(data.contentType == 'text/html'){
		var a=extractHostname(data.url);
		console.log(`${new Date()}`.black.bgCyan+` ${a}`);
	}
	return data
}

var configg = {
    prefix: '/;/',
	requestMiddleware: [
		userAgent
	],
	responseMiddleware: [
		log
	]
}
app.use(new Unblocker(configg));
app.get('/', (req, res) => {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.sendFile(path.join(__dirname + '/public/'));
});