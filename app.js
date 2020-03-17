const config = require("./config.json"),
	colors = require('colors'),
	fetch = require('node-fetch'),
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
	publicIp = require('public-ip'),
	sleep = require('sleep'),
	blacklist=config['blacklist'],
	socketInfo=require('./modules/socketInfo.js'),
	startDate=new Date(),
	readline = require('readline'),
	socketAntiSpam = new SocketAntiSpam({
		banTime:            20,
		kickThreshold:      3,
		kickTimesBeforeBan: 2,
		banning:            true,
		io:                 io
	});
var messageSending = true,
	killSwitch = false,
	last50=[],
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
	fallbackmode=false,
	helpername=config.helper,
	staffname=config.staff;

socketAntiSpam.event.on('ban', data => {
		var date=new Date();
		var IP=data.handshake.headers['cf-connecting-ip']; if(typeof IP == 'undefined')return;
		console.log(`${date} `+IP.black.bgGreen+` `+`Spam score of 3`.black.bgRed); //console.log(data);
});
bot.on(`ready`, async suck => {
	bot.user.setPresence({ activity: { type:'WATCHING', name: 'social transmissions' }, status: 'dnd' })
		.catch(err => console.log(err));
	bot.channels.fetch(channel).then(channel => { channel.messages.fetch({ limit: 50 }).then(messages => {
		let arr = messages.array().reverse();
		last50=arr;
	})});
	console.log('Fetched last 50 messages'.black.bgYellow);
	ip2proxy.Open("./IP2PROXY-LITE-PX2.BIN");
});
function idbanlist(){
	fs.readFile('./banned.json', function (err, data) {
		var msg=""
		var json = JSON.parse(data)
		json.ids.forEach((e,i,a) => {
			msg+='``'+e+'``, '
		});
		return msg
	});	
}
var pui4,
	pui6;
async function bruh(){
	await publicIp.v4().then(a=>{pui4=a});
	await publicIp.v6().then(a=>{pui6=a});
}
bruh();
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

function ipban(ip){
	fs.readFile('./banned.json', function (err, data) {
		var json = JSON.parse(data)
		json.banned.push(ip)
		fs.writeFile("./banned.json", JSON.stringify(json),function(err){ if (err) throw err;})
	});
	return `OK, IP ${ip} will be banned.`;
}
function idban(id){
	fs.readFile('./banned.json', function (err, data) {
		var json = JSON.parse(data)
		json.ids.push(id)
		fs.writeFile("./banned.json", JSON.stringify(json),function(err){ if (err) throw err;})
	});
	return `OK, ID ${id} will be banned.`;
}
function unipban(ip){
	fs.readFile('./banned.json', function (err, data) {
		var json = JSON.parse(data)
		json.banned.forEach((e,i,a) => {
			if(e===ip){
				json.banned.splice(i, 1); 
			}
		});
		fs.writeFile("./banned.json", JSON.stringify(json),function(err){ if (err) throw err;})
	});
	return `OK, IP **${ip}** will be unbanned.`
}
function unidban(id){
	fs.readFile('./banned.json', function (err, data) {
		var json = JSON.parse(data)
		json.ids.forEach((e,i,a) => {
			if(e===id){
				json.ids.splice(i, 1); 
			}
		});
		fs.writeFile("./banned.json", JSON.stringify(json),function(err){ if (err) throw err;})
	});
	return `OK, ID ${id} will be unbanned.`
}

bot.on("messageDelete", async message => {
	last50.forEach((e,i,a)=>{
		if(e.id===message.id){
			e.content='[RETRACTED]';
			io.sockets.emit('messageDelete',{ msgID: message.id });
			return
		};
	});
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
					bot.channels.fetch(channel).then(channel => { channel.messages.fetch({ limit: 50 }).then(messages => {
						let arr = messages.array().reverse();
						last50=arr;
					})});
					console.log('Fetched last 50 messages'.black.bgYellow);
					io.sockets.emit('injectcode',{'run':'location.reload();'});
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
			message.channel.send(ipban(args[1]));
		}
	}
	if(args[0].toLowerCase()==='-idban'){
		if(staff || message.author.id==="275757537327054848"){
			message.channel.send(idban(args[1]));
		}
	}
	if(args[0].toLowerCase()==='-ipunban' || args[0].toLowerCase()==='+ipban'){
		if(staff || message.author.id==="275757537327054848"){
			message.channel.send(unipban(args[1]))
		}
	}
	if(args[0].toLowerCase()==='-idunban' || args[0].toLowerCase()==='+idban'){
		if(staff || message.author.id==="275757537327054848"){
			message.channel.send(unidban(args[1]))
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
	if(args[0].toLowerCase()==='-ipbans' && (staff || message.author.id==="275757537327054848")){
		fs.readFile('./banned.json', function (err, data) {
			var msg=""
			var json = JSON.parse(data)
			json.banned.forEach((e,i,a) => {
				msg+='``'+e+'``, '
			});
			message.channel.send(msg)
		});
	}
	if(args[0].toLowerCase()==='-idbans' && (staff || message.author.id==="275757537327054848")){
		fs.readFile('./banned.json', function (err, data) {
			var msg=""
			var json = JSON.parse(data)
			json.ids.forEach((e,i,a) => {
				msg+='``'+e+'``, '
			});
			message.channel.send(msg)
		});
	}
	if(args[0].toLowerCase()==='-killswitch'){
		if(staff){ killSwitch=!killSwitch; message.channel.send('OK, killSwitch set to: `'+killSwitch.toString()+'`.'); }
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
	var content = message.content.replace('&','&amp;').replace('>','&gt;').replace('<','&lt;').replace('"','&quot;').replace("'",'&#x27;').replace(/(http.:\/\/.*?(?:.*))/ig,'<a href="$1">$1</a>').replace('/','&#x2F;');
	var parserRules = [
		{ pattern: /```js\n/, replacement: '```' },
		{ pattern: /```css\n/, replacement: '```' },
		{ pattern: /```html\n/, replacement: '```' },
		{ pattern: /```php\n/, replacement: '```' },
		{ pattern: /^(?!\*\*)\*([\s\S]*?)\*/, replacement: '<i>$1<i>' }, //italics
		{ pattern: /~~([\s\S]*?)~~/, replacement: '<strike>$1</strike>' }, //strikeout
		{ pattern: /\*\*([\s\S]*?)\*\*/, replacement: '<b>$1</b>' }, //bold
		{ pattern: /<b>\*([\s\S]*?)<\/b>\*/, replacement: '<i><b>$1</b></i>' }, //bolditalics
		{ pattern: /__([\s\S]*?)__/, replacement: '<u>$1</u>' }, //underline
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
	bot.channels.fetch(channel).then(yee => { chanName=yee.name }).catch(function(){});
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
		if(avatardata<0 || avatardata>4){avatardata=0};
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
					if(IP.match(new RegExp(yes))){
						banned=true;
						return;
					}
				});
				JSON.parse(dae).banned.forEach(yes => {
					if(IP.match(new RegExp(yes))){
						banned=true;
						return;
					}
				});
				JSON.parse(dae).ids.forEach(yes => {
					if(ID.match(new RegExp(yes))){
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
					console.log('stupid embed who needs that anyways')
				}
				if(banned==true){
					io.sockets.emit('banned');
					socket.disconnect();
					return;
				} else {
					if(fallbackmode==true){
						io.sockets.emit('message',{ msgID:getRndInteger(), embed:'', color:'white', authorid:'', content:content, dateStr: new Date(), pingstr: '', timestamp: new Date(), botstr: '<span class="bot">BOT</span>&nbsp;', username: username, avatar: avat, date: new Date(), chanName: "notchannelname" });	
						var d=new Date();
						var t=d.getTime();
						var newmsg={"channelID":channel,"deleted":false,"id":getRndInteger(111111111111,999999999),"type":"DEFAULT","content":content,"authorID":"635576642370142210","pinned":false,"tts":false,"system":false,"embeds":[],"attachments":[],"createdTimestamp":t,"editedTimestamp":null,"webhookID":null,"applicationID":null,"activity":null,"flags":0,"reference":null,"guildID":"419123358698045453","cleanContent":content}
						last50.push(newmsg);		
						return;
					}
					var body={
						"username": username,
						"avatar_url": avat,
						"content": content
					};
					fetch(url, {
						method: 'post',
						body:    JSON.stringify(body),
						headers: { 'Content-Type': 'application/json' },
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
var bannedurls=['trafficjunky.net','localhost','192.168','whatsmyip.com']
function userAgent(data){
	bannedurls.forEach(e=>{
		if(extractHostname(data.url).includes(e)){
			data.clientResponse.status(403).send('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"/><title>403 - Forbidden: Access is denied.</title><style type="text/css"><!--body{margin:0;font-size:.7em;font-family:Verdana, Arial, Helvetica, sans-serif;background:#EEEEEE;}fieldset{padding:0 15px 10px 15px;}h1{font-size:2.4em;margin:0;color:#FFF;}h2{font-size:1.7em;margin:0;color:#CC0000;}h3{font-size:1.2em;margin:10px 0 0 0;color:#000000;}#header{width:96%;margin:0 0 0 0;padding:6px 2% 6px 2%;font-family:"trebuchet MS", Verdana, sans-serif;color:#FFF;background-color:#555555;}#content{margin:0 0 0 2%;position:relative;}.content-container{background:#FFF;width:96%;margin-top:8px;padding:10px;position:relative;}--></style></head><body><div id="header"><h1>Server Error</h1></div><div id="content"><div class="content-container"><fieldset><h2>403 - Forbidden: Access is denied.</h2><h3>You do not have permission to view this directory or page using the credentials that you supplied.</h3></fieldset></div></div></body></html>');
		}
	});
	data.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36 OPR/12';
	if(extractHostname(data.url)==='google.com')data.headers['cookie'] = '';
	return data
}
var util = require('util');
function log(data) {
	if(data.contentType == 'text/html'){
		var a=extractHostname(data.url);
		console.log(`${new Date()}`.black.bgCyan+` ${a}`);
	}
	return data
}
function injectScript(data) {
    if (data.contentType == 'text/html') { // https://nodejs.org/api/stream.html#stream_transform
		data.stream = data.stream.pipe(
			new Transform({
				decodeStrings: false,
				transform: function(chunk, encoding, next) {
				const updated = chunk
				.toString()
				.replace('_blank','_self')
				.replace('_parent','_self')
				.replace('_top','_self')
				.replace('</body>','<script src="//code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script><script>eval(unescape(atob("dmFyIG92ZXJsYXk9ITA7JChkb2N1bWVudCkua2V5ZG93bihmdW5jdGlvbihlKXt2YXIgbD10b3A7IjE3Ij09ZS53aGljaD9jbnRybElzUHJlc3NlZD0hMDo3Nz09ZS53aGljaCYmY250cmxJc1ByZXNzZWQ/KCJub25lIiE9PWwuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoInJ1c2ljLW1vZGFsIikuc3R5bGUuZGlzcGxheT8obC5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgicnVzaWMtbW9kYWwiKS5zdHlsZS5kaXNwbGF5PSJub25lIiwhMD09PW92ZXJsYXkmJihsLmRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoIm92ZXJsYXkiKVswXS5zdHlsZS5kaXNwbGF5PSJub25lIikpOihsLmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJydXNpYy1tb2RhbCIpLnN0eWxlLmRpc3BsYXk9ImluaXRpYWwiLCEwPT09b3ZlcmxheSYmKGwuZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgib3ZlcmxheSIpWzBdLnN0eWxlLmRpc3BsYXk9ImluaXRpYWwiKSksY250cmxJc1ByZXNzZWQ9ITEpOmNudHJsSXNQcmVzc2VkPSExfSk7")))</script></body>')
				.replace(pui4,'255.255.255.255')
				.replace(pui6,'1234:56AB::CD78:9110')
				.replace(`>${pui4}`,'>255.255.255.255')
				this.push(updated, "utf8");
				next();
			}
		}))
    }
}
var configg = {
    prefix: '/;/',
	requestMiddleware: [
		userAgent
	],
	responseMiddleware: [
		log,
		injectScript
	]
}
app.use(new Unblocker(configg));
app.get('/', (req, res) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.sendFile(path.join(__dirname + '/public/'));
});
process.stdout.write("\x1Bc")
console.log(Array(process.stdout.rows + 1).join('\n'));

const rl = require("serverline")

rl.init()
rl.setCompletion(['say', 'togglechat', 'uptime', 'ipbans', 'idbans', 'stop', 'killswitch'])
rl.setPrompt('> ')
rl.on('line', function(line) {
	var args=line.split(' ');
	var mts=line.substr(args[0].length+1,128);
	switch (args[0]) {
		case'say':
			bot.channels.fetch(channel).then(channelh => {
				channelh.startTyping();
				setTimeout(()=>{
					channelh.send(mts).catch(function(){channelh.stopTyping()});
					channelh.stopTyping();
				},(mts.length*150))
			});
			break
		case'uptime':
			console.log(getUptime());
			break
		case'togglechat':
			messageSending=!messageSending;
			io.sockets.emit('permsChange',{ messageSending: messageSending });
			console.log(`OK, messageSending set to: ${messageSending.toString()}.`);
			break
		case'ipban':
			console.log(ipban(args[1]));
			break
		case'idban':
			console.log(idban(args[1]));
			break
		case'':
			console.log(unipban(args[1]));
			break
		case'unidban':
			console.log(unidban(args[1]));
			break
 		case'ipbans':
			fs.readFile('./banned.json', function (err, data) {
				var msg=""
				var json = JSON.parse(data)
				json.banned.forEach((e,i,a) => {
					msg+=`${e}, `
				});
				console.log(msg)
			});
			break
 		case'idbans':
			fs.readFile('./banned.json', function (err, data) {
				var msg=""
				var json = JSON.parse(data)
				json.ids.forEach((e,i,a) => {
					msg+=`${e}, `
				});
				console.log(msg)
			});
			break
 		case'killswitch':
			killSwitch=!killSwitch; console.log(`OK, killSwitch set to: ${killSwitch.toString()}.`);
			break
 		case'ic':
			io.sockets.emit('injectcode',{'run':mts});
			break
 		case'fallback':
			fallbackmode=!fallbackmode; console.log(`OK, fallbackmode set to: ${fallbackmode.toString()}.`);
			break
		case'stop':
			console.log('Shutting down...');
			process.exit(0);
			break
		case'run':
			eval(mts);
			break
		default:
			console.log(`chatparser: ${args[0]}: command not found`);
			break
	}
});
rl.on('SIGINT', function(rl) {
  rl.question('Are you sure you want to exit? (Y/N) ', (answer) => answer.match(/^y(es)?$/i) ? process.exit(0) : rl.output.write('\x1B[1K> '))
})
