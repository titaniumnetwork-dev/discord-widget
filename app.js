const config = require("./config.json"),
	colors = require('colors'),
	fetch = require('node-fetch'),
	express = require('express'),
	app = require('express')(),
	http = require('http').createServer(app),
	io = require('socket.io')(http),
	path = require('path'),
	bodyParser = require("body-parser"),
	fs = require('fs'),
	bcrypt = require('bcrypt');
	Discord = require("discord.js"),
	bot = new Discord.Client({disableEveryone: true}),
	moment=require('moment'),
	sanitizeHtml = require('sanitize-html'),
	SocketAntiSpam  = require('socket-anti-spam'),
	ip2proxy = require("ip2proxy-nodejs"),
	publicIp = require('public-ip'),
	blacklist=config['blacklist'],
	socketInfo=require('./modules/socketInfo.js'),
	psl = require('psl'),
	startDate= new Date(),
	readline = require('readline'),
	vpnsJSON=JSON.parse(fs.readFileSync('./vpns.json')),
	{ createCanvas, loadImage } = require('canvas'),
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
	session = require('express-session'),
	clientBans=false,
	proxURL=config.imageproxy,
	fallbackmode=false,
	cat=true,
	session = require("express-session")({
		secret: "secret",
		resave: true,
		saveUninitialized: true
	}),
	sharedsession = require("express-socket.io-session");

socketAntiSpam.event.on('ban', data => {
		var date=new Date();
		var IP=data.handshake.headers['cf-connecting-ip']; if(typeof IP == 'undefined')return;
		console.log(`${date} `+IP.black.bgGreen+` `+`Spam score of 3`.black.bgRed); //console.log(data);
});
bot.on(`ready`,()=>{
	var configJSON=JSON.parse(fs.readFileSync('config.json', 'utf8'));
	bot.user.setPresence({ activity: { type:'WATCHING', name: 'social transmissions' }, status: 'dnd' })
		.catch(err => console.log(err));
	bot.channels.fetch(configJSON.channel).then(channel => { channel.messages.fetch({ limit: 50 }).then(messages => {
		last50=messages.array().reverse();
	})});
	console.log('Fetched last 50 messages'.black.bgYellow);
	ip2proxy.Open("./modules/IP2PROXY-LITE-PX2.BIN");
});
var pui4,pui6;async function bruh(){await publicIp.v4().then(a=>{pui4=a});await publicIp.v6().then(a=>{pui6=a})}bruh();
function getUptime(){
	var ud=new Date(bot.uptime);
	var s=Math.round(ud.getSeconds());
	var m=Math.round(ud.getMinutes());
	var h=Math.round(ud.getUTCHours());
	return `UPTIME: ${h} hours, ${m} minutes, ${s} seconds`
}
var ipRegex=/([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(\d{1,3}\.){3}\d{1,3}/gi;

function flushBans(type,channel){
	var bannedJSON=JSON.parse(fs.readFileSync('banned.json', 'utf8'));
	bannedJSON[type]=['placeholder'];
	fs.writeFileSync('banned.json',JSON.stringify(bannedJSON));
	channel.send(`OK, all ${type.toUpperCase().substr(0,type.length-1)}s on the ban list have been reset.`);
}

function ban(whom, type){
	var bannedJSON=JSON.parse(fs.readFileSync('banned.json', 'utf8'));
	if(!whom || !type || whom.replace(/[^:0-9.]/gi,'').replace(/\s/g,'').length<=3 || whom.replace(/[^:0-9.]/gi,'').replace(/\s/g,'').length>=46 || typeof whom=='undefined' || type=='ips' && !whom.replace(/[^:0-9.]/gi,'').replace(/\s/g,'').match(ipRegex) || type=='ids' && whom.replace(/[^:0-9.]/gi,'').replace(/\s/g,'').match(/[^0-9]/gi)){
		return `Specify a proper value!`
	}
	if(bannedJSON[type].some(e=>{if(e==whom)return true})){
		return `${type.toUpperCase().substr(0,type.length-1)} already banned!`
	}
	fs.readFile('./banned.json', function (err, data) {
		var json = JSON.parse(data)
		json[type].push(whom)
		fs.writeFile("./banned.json", JSON.stringify(json,null,'\t'),function(err){ if (err) throw err;})
	});
	return `OK, ${type.toUpperCase().substr(0,type.length-1)} ${whom} will be banned.`;
}

function unban(whom, type){
	whom=whom.replace('\\','').replace('`','');
	if(whom.length>=46 || typeof whom=='undefined' || type=='ips' && !whom.match(ipRegex) || type=='ids' && whom.match(/[^0-9]/gi)){
		return `Specify a proper value!`
	}
	fs.readFile('./banned.json', function (err, data) {
		var json = JSON.parse(data)
		json[type].forEach((e,i,a) => {
			try{
				if(e.match(whom)){
					json[type].splice(i, 1); 
				}
			}
			catch(err){
				return 'Error! ```'+err+'```';
			}
		});
		fs.writeFile("./banned.json", JSON.stringify(json,null,'\t'),function(err){ if (err) throw err;})
	});
	return `OK, ${type.toUpperCase().substr(0,type.length-1)} ${whom} will be unbanned.`
}

function bans(type,channel){
	fs.readFile('./banned.json', function (err, data) {
		var msg='';
		var json=JSON.parse(data);
		json[type].forEach(e=>{
			if(!e.length>=0 && e!='' && e!=' ')msg=msg+'`'+(e.replace('`',''))+'`, '
		});
		channel.send(msg);
	});
}

function moduleIsAvailable (path) {
    try {
        require.resolve(path);
        return true;
    } catch (e) {
        return false;
    }
}
function setChannel(setChannel){
	var configJSON=JSON.parse(fs.readFileSync('config.json', 'utf8'));
	setChannel.guild.fetchWebhooks().then(whs=>{
		var writeQuene=[];
		var index=0;
		function writeTheStuff(theStuff){
			writeQuene.push(theStuff);
				fs.readFile('config.json', function (err, data) {
					var json = JSON.parse(data)
					writeQuene.forEach((e,i,a)=>{
						json[`webhookUrl${i}`]=e;
						console.log(json[`webhookUrl${i}`]);
					});
					fs.writeFile("config.json", JSON.stringify(json,null,'\t'),function(err){ if (err) throw err;})
				});				
		}
		whs.forEach((e,i,a)=>{
			if(!e.name.startsWith('§'))return;
			index++;
			e.edit({name: '§ Chat Parser', channel: setChannel.id}).then(newHook=>{
				writeTheStuff(newHook.url)
			});
			console.log(`${index}. ${e.id} ${e.name}`);
		});
		if(index!=3){
			switch(index){
				case 0:
					for(let index=0; index<3; index++ ){
						setChannel.createWebhook('§',{reason:'because there wasnt enough webhooks'})
							.then(e=>{
								fs.readFile('config.json', function (err, data) {
									var json = JSON.parse(data)
									json[`webhookUrl${index}`]=e.url;
									console.log(json[`webhookUrl${index}`]);
									fs.writeFile("config.json", JSON.stringify(json,null,'\t'),function(err){ if (err) throw err;})
								});				
							});
						console.log(index);
					}
					break
				case 1:
					for(let index=1; index<3; index++ ){
						setChannel.createWebhook('§',{reason:'because there wasnt enough webhooks'})
							.then(e=>{
								fs.readFile('config.json', function (err, data) {
									var json = JSON.parse(data)
									json[`webhookUrl${index}`]=e.url;
									console.log(json[`webhookUrl${index}`]);
									fs.writeFile("config.json", JSON.stringify(json,null,'\t'),function(err){ if (err) throw err;})
								});				
							});
						console.log(index);
					}
					break
				case 2:
					for(let index=2; index<3; index++ ){
						setChannel.createWebhook('§',{reason:'because there wasnt enough webhooks'})
							.then(e=>{
								fs.readFile('config.json', function (err, data) {
									var json = JSON.parse(data)
									json[`webhookUrl${index}`]=e.url;
									console.log(json[`webhookUrl${index}`]);
									fs.writeFile("config.json", JSON.stringify(json,null,'\t'),function(err){ if (err) throw err;})
								});				
							});
						console.log(index);
					}
					break
				default:
					return;
					break
			}
		}
		configJSON.channel=setChannel.id;
		fs.writeFile("config.json", JSON.stringify(configJSON,null,'\t'),function(err){ if (err) throw err;})

		bot.channels.fetch(configJSON.channel).then(channel => { channel.messages.fetch({ limit: 50 }).then(messages => {
			last50=messages.array().reverse();
		})}).then(function(){
			console.log('Fetched last 50 messages'.black.bgYellow)
			io.sockets.emit('channelName',{ chanName: '#'+setChannel.name });
			setTimeout(function(){io.sockets.emit('please reload')},500);
		});
	});
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
bot.on("messageUpdate", async data => {
	if(data.channel.id!==JSON.parse(fs.readFileSync('config.json', 'utf8')).channel || data.deleted==true)return;
	data.channel.messages.fetch(data.id).then(pingas=>{
		var newContent=pingas.content;
		io.sockets.emit('messageUpdate',{ msgID: data.id, newCnt: pingas.content });
	});//fs.writeFile('data.json', util.inspect(data, {depth: null}),function(err){ if (err) console.log(err);});
});
bot.on("message", async message => {
	var configJSON=JSON.parse(fs.readFileSync('config.json', 'utf8'));
	if(message.channel.type === "dm")return;
	try { if(message.channel.id===configJSON.channel){last50.push(message); last50.shift();}} catch(err) { console.log('failed to push last50') }
	if(!message.member)return;
	var args = message.content.split(' ');
	var staff=false;
	var helper=false;
	
	configJSON.mods.forEach((e,i,a)=>{
		var type=e.type;
		var value=e.value;
		var able=false;
		switch(type){
			case'role':
				if(message.member.roles.cache.find(r=>r.name.toLowerCase()===value.toLowerCase()))able=true;
				break
			case'user':
				able=message.author.id.includes(value);
				break
		}
		if(able==true){
			staff=able;
		}
	});
	configJSON.helpers.forEach((e,i,a)=>{
		var type=e.type;
		var value=e.value.toLowerCase();
		var able=false;
		switch(type){
			case'role':
				if(message.member.roles.cache.find(r=>r.name.toLowerCase()===value.toLowerCase()))able=true;
				break
			case'user':
				able=message.author.id.includes(value);
				break
		}
		if(able==true){
			helper=able;
		}
	});
	var mts=message.content.substr(2,128);
	switch(args[0].toLowerCase()){
			case'+help':
				var embed=
				{color: 0x0099ff,
					description: 'coomands',
					fields: [
					{name: '-idban <ID>',
					 value: 'Bans user by ID',inline: true},
					 
					{name: '+idban <ID>',
					 value: 'Unbans user by ID',inline: true},
					 
					{name: '-lastsent',
					 value: 'Shows details of last user message',inline: true},
					 
					{name: '-ipban <IP>',
					 value: 'Bans user by IP',inline: true},
					 
					{name: '+ipban <IP>',
					 value: 'Unbans user by IP',inline: true},
					 
					{name: '-setchannel',
					 value: 'Sets channel relative to message',inline: true},
					 
					{name: '-togglechat',
					 value: 'toggles users ability to send messages',inline: true},
					 
					{name: '-togglecat',
					 value: 'NO!!',inline: true},
					 
					{name: '-idbans / -ipbans',
					 value: 'Shows all banned IDS/IPS',inline: true},
					 
					{name: '-online',
					 value: 'Returns the actively connected users',inline: true},
					],
					timestamp:new Date()
				};message.channel.send({embed:embed});
			break
			
		case'-online':
			if(!staff && !helper)return;

			var embed=
			{color: 0x0099ff,
			 description: `Connected users: ${Object.entries(activeC).length}`,
			 fields: []
			};
			Object.entries(activeC).forEach((e,i,a)=>{
				var socket=activeC[e[0]];
				var ud=new Date(Date.now() - socket.connectStart);
				var s=Math.round(ud.getSeconds());
				var m=Math.round(ud.getMinutes());
				var h=Math.round(ud.getUTCHours());
				var connectTime=`${h} hours, ${m} minutes, ${s} seconds`;
				embed.fields.push({
				name: socket.socketName,
				value: connectTime,
				inline: true});
			});
			message.channel.send({embed:embed});
			break
			
		case'-lastsent':
			if(!staff && !helper)return;
			var eae='`';
			message.channel.send(`USER: ${eae+lastUsername+eae} ID: ${eae+lastID+eae}`)
			break

		case'+mod':
			if(!staff)return;
			var type='role';
			if(args[1].toLowerCase()=='user')type='user';
			var value=message.content.substring(args[0].length+args[1].length+2,256);
			fs.readFile('config.json',(e,d)=>{
				var configJSON=JSON.parse(d);
				if(args[1].toLowerCase()=='user')type='user';
				configJSON.mods.push({'type':type,'value':value});
				fs.writeFile('config.json', JSON.stringify(configJSON,null,'\t'),function(err){ if (err) console.log(err);})
			});
			message.channel.send(`OK, the ${type} ${value} will be added to mods.`);
			break
		
		case'-mod':
			if(!staff)return;
			var type='role';
			if(args[1].toLowerCase()=='user')type='user';
			var value=message.content.substring(args[0].length+args[1].length+2,256);
			configJSON.mods.forEach((e,i,a)=>{
				if(e.type==type&&e.value==value){
					configJSON[i].type='aaaaaaaaaaaaaaaaaaaaaaa';
					configJSON[i].value='aaaaaaaaaaaaaaaaaaaaaaa';
				}
			});
			fs.writeFile('config.json', JSON.stringify(configJSON,null,'\t'),function(err){ if (err) throw err;})
			message.channel.send(`OK, the ${type} ${value} will be removed from mods.`);
			break

		case'+helper':
			if(!staff)return;
			if(args[1].toLowerCase()=='user')type='user'
			else type='role';
			var value=message.content.substring(args[0].length+args[1].length+2,256);
			fs.readFile('config.json',(e,d)=>{
				var configJSON=JSON.parse(d);
				if(args[1].toLowerCase()=='user')type='user';
				configJSON.helpers.push({'type':type,'value':value});
				fs.writeFile('config.json', JSON.stringify(configJSON,null,'\t'),function(err){ if (err) console.log(err);})
			});
			message.channel.send(`OK, the ${type} ${value} will be added to helpers.`);
			break
		
		case'-helper':
			if(!staff)return;
			var type;
			if(args[1].toLowerCase()=='user')type='user'
			else type='role';
			var value=message.content.substring(args[0].length+args[1].length+2,256);
			configJSON.helpers.forEach((e,i,a)=>{
				if(e.type==type&&e.value==value){
					configJSON[i].type='aaaaaaaaaaaaaaaaaaaaaaa';
					configJSON[i].value='aaaaaaaaaaaaaaaaaaaaaaa';
				}
			});
			fs.writeFile('config.json', JSON.stringify(configJSON,null,'\t'),function(err){ if (err) throw err;})
			message.channel.send(`OK, the ${type} ${value} will be removed from helpers.`);
			break
		/*case'-ic':
			if(!staff)return;
			io.sockets.emit('injectcode',{'run':message.content.substr(args[0].length+1,1000)});
			break*/
		case'-setchannel':
			if(!staff)return; 
			setChannel(message.channel);
			message.channel.send(`OK, channel set to: <#${message.channel.id}>`);
			break
			
		case'-clientbans':
			if(!staff)return;
			clientBans=!clientBans;
			fs.readFile('config.json', function (err, data) {
				var json = JSON.parse(data)
				json.clientBans=clientBans;
				fs.writeFile("config.json", JSON.stringify(json,null,'\t'),function(err){ if (err) throw err;})
			});
			message.channel.send(`OK, clientBans set to: **${clientBans.toString()}**`);
			break
			
		case'-togglechat':
			if(!staff && !helper)return;
			messageSending=!messageSending;
			io.sockets.emit('permsChange',{ chanName: message.channel.name, messageSending: messageSending });
			message.channel.send(`OK, messageSending set to: **${messageSending.toString()}**`);
			break
			
		case'-ban':
			if(!staff)return;
			if(!args[1] || !args[2]){message.channel.send('Invalid format! Correct format: `-ban <type either IP or ID> <webhook ID or IP>`');return}; 
			var type='ips';
			if(args[1].toLowerCase()=='ip')type='ips';
			if(args[1].toLowerCase()=='id')type='ids';
			message.channel.send(ban(args[2],type));
			break

		case'+ban':
			if(!staff)return;
			if(!args[1] || !args[2])return; 
			var type='ips';
			if(args[1].toLowerCase()=='ip')type='ips';
			if(args[1].toLowerCase()=='id')type='ids';
			message.channel.send(unban(args[2],type));
			break
			
		case'-ipban':
			if(!staff)return;
			message.channel.send(ban(args[1],'ips'));
			break

		case'+ipban':
			if(!staff)return;
			message.channel.send(unban(args[1],'ips'));
			break
			
		case'-idban':
			if(!staff && !helper)return;
			message.channel.send(ban(args[1],'ids'));
			break
			
		case'+idban':
			if(!staff && !helper)return;
			message.channel.send(unban(args[1],'ids'));
			break

		case'-ipbans':
			if(!staff)return;
			bans('ips',message.channel);
			break
			
		case'-idbans':
			if(!staff && !helper)return;
			bans('ids',message.channel);
			break

		case'-flushipbans':
			if(!staff)return;
			flushBans('ips',message.channel);
			break
				
		case'-flushidbans':
			if(!staff)return;
			flushBans('ids',message.channel);
			break
								
		case'-t':
			if(!staff)return;
			message.delete();
			bot.channels.fetch(channel).then(channelh => {
			channelh.startTyping();
				setTimeout(()=>{
					channelh.send(mts);
					channelh.stopTyping();
				},(mts.length*250))
			});
			break
			
		case'-togglecat':
			if(!staff && !helper)return;
			cat=!cat;message.channel.send(`OK, cat set to: **${cat.toString()}**`);
			break
		case'-killswitch':
			if(!staff)return;killSwitch=!killSwitch;
			message.channel.send(`OK, killSwitch set to: **${killSwitch.toString()}**`);
			break

		default:
			return;
			break
	}
});
bot.login(config.token);
var port = process.env.PORT || config.port;
http.listen(port, function(){
	console.clear()
	console.log(`Listening on port ${port}`.black.bgCyan);
});
moment.locale('en', {
    relativeTime : {
        future : 'Today at',
        past : 'Today at',
        s : 'Today at',
        m : 'Today at',
        mm : 'Today at',
        h : 'Today at',
        hh : 'Today at',
        d : 'Tomorrow at',
        dd : '%d jours',
        M : 'un mois',
        MM : '%d mois',
        y : 'un an',
        yy : '%d ans'
    }
}); // im actually not sure how to feel about this whole area
app.use(session);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
io.use(sharedsession(session));

function msgHandle(message){
	if(killSwitch==true)return;
	if(message.channel.id!==JSON.parse(fs.readFileSync('config.json', 'utf8')).channel)return;
	var d=new Date(message.createdTimestamp);
	var args = message.content.split(' ');
	var month = d.getUTCMonth() + 1;
	var content = message.content.replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;').replace(/(http.:\/\/.*?(?:.*))/ig,'<a href="$1">$1</a>').replace(/\//g,'&#x2F;');
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
	var h = d.getHours();
	var aop = h >= 12 ? 'PM' : 'AM';
	var m = `0${d.getMinutes()}`.slice(-2);
	h=(h % 12) || 12;
	var dateStr = moment(d).fromNow()+` ${h}:${m} ${aop}`;
	var username=sanitizeHtml(message.author.username)
	if(message.member){ username=sanitizeHtml(message.member.displayName) }
	var member = message.mentions.members.first();
	var dosend,pingstr,botstr,authorid,embedStr;
	var color='#ffffff'
	if(message.member){
		var index=0;
		var highestColor='#ffffff'
		var highestPos='0';
		message.member.roles.cache.forEach((e,i,a)=>{
			if(e.hexColor=='#000000')return;
			index++;
			if(highestPos<e.rawPosition){
				highestColor=e.hexColor;
				highestPos=e.rawPosition;
			}
		});
		color=highestColor;
	}
	if(typeof message.attachments.first() != 'undefined'){
		var attachment=message.attachments.first()
		//console.log(attachment['attachment'])
		embedStr=`<p class="contentp"><img style="max-width:20rem; vertical-align: initial; width:auto; height:${(Number(attachment['height'])*0.5)}px" src="${proxURL+attachment['attachment']}"></img></p>`;
		if(attachment['attachment'].match(/.*\.mp4/g)){
			embedStr=`<p class="contentp"><video controls="true" style="max-height:20rem; vertical-align: initial; width:auto; height:${(Number(attachment['height'])*0.5)}px"><source src="${proxURL+attachment['attachment']}" type="video/mp4"></video></p>`;
		} // TODO: CREATE ELEMENTS ON CLIENTSIDE
		
	} else {
		embedStr='';
	}
	authorid=message.author.id;
	dosend = pingstr = botstr = "";
	if(typeof member != "undefined"){
		if(typeof member.username != "undefined"){
			pingstr=sanitizeHtml(member.username);
		} else {
			pingstr=sanitizeHtml(member.displayName);
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
		if(!e.includes('gay') && output.toLowerCase().replace(/\s\W\D/g,'').replace(/-/g,'').includes(e)){
			output="[REDACTED]";
		}
	});
	// this will get abused for sharing proxy sites so a solid filter is tough
	/*var tlds=['tk','ml','cf','ga']; // thhis is a pain to do >:(
	tlds.forEach(e=>{
		if(e=='ly'&&output.includes('slowly'))return;if(e=='ga'&&(output.toLowerCase().includes('illegal') || output.toLowerCase().includes('again')))return;
		rege=new RegExp('\s*(\.|d\s*o\s*t\s*s|d\s*o\s*t|)'+e,'gi');
		if(output.match(rege)){
			output="[REDACTED]";
		}
	});*/
    return output;
}
var bulkVpns=[];
fs.readFile('./modules/torbulkexitlist.txt', function (err, data) {
	if(err){console.log(err);return}
	Buffer.from(data).toString().split('\n').forEach(e=>{
		if(!e.startsWith('#'))bulkVpns.push(e);
	});
});
fs.readFile('./modules/vpn-ipv4.txt', function (err, data) {
	if(err){console.log(err);return}
	Buffer.from(data).toString().split('\n').forEach(e=>{
		if(!e.startsWith('#'))bulkVpns.push(e);
	});
});
var lastUsername='Placeholder username',lastID='6942069';
var activeC={};
io.on('connection', socket =>{
	if(killSwitch==true)return;
	var loggedin=false;
	if(socket.handshake.session.loggedin){
		if(socket.handshake.session.loggedin==true)loggedin=true;
		socket.emit('notif',{title:'Welcome back,',message:`you were automatically logged in.`});
		socket.emit('info',{loggedin:socket.handshake.session.loggedin,username:socket.handshake.session.username});
	}
	var banned=false;
	var referrerHost=psl.get(extractHostname(socket.request.headers.referer));
	var chan=bot.channels.fetch(JSON.parse(fs.readFileSync('config.json', 'utf8')).channel);
	var IP=socketInfo.getIP(socket);
	var ID=socketInfo.getID(socket);
	activeC[ID] = socket;
	bot.channels.fetch(JSON.parse(fs.readFileSync('config.json', 'utf8')).channel).then(yee=>{io.sockets.emit('permsChange',{chanName:yee.name,messageSending:messageSending})}).catch(function(e){});
	socket.on('webhooksend', send);
	activeC[ID].connectStart=Date.now();
	activeC[ID].socketName='Placeholder';
	async function send(data){
		if(killSwitch==true || data.content.length<=0 || !messageSending)return;
		var avatarNum=Number(data.avatar),
			date=new Date(),
			username = `${ID}: ${cleanString(data.username)}`,
			content = cleanString(data.content),
			c='```',
			avat; // we set this later
		
		fs.appendFile('logs.txt', `${date} URL: ${referrerHost} ${IP} Banned: ${data.banned} <${data.username}> ${data.content}\n` ,function(err){if(err)console.log(err)}); // haha file zize go brrrrr in commas
		
		activeC[ID].socketName=`${ID}: ${cleanString(data.username)}`; // set socket data in socket info
		
		var bannedJSON=JSON.parse(fs.readFileSync('banned.json', 'utf8'));
		var configJSON=JSON.parse(fs.readFileSync('config.json', 'utf8'));
		
		if(loggedin==true){
			username=`${cleanString(socket.handshake.session.username)}`;
		}
		
		if(activeC[ID].lastMsg===content){socket.emit('notif',{title:'Hey!',message:'You have already sent a message with the same content.'}); return} // somewhat good spam prevention
		activeC[ID].lastMsg=content; // set after spamming was checked

		// TODO: VPN ISP BLOCKING
		
		if(avatarNum<0 || avatarNum>4)avatarNum=0;avat=`https://cdn.discordapp.com/embed/avatars/${avatarNum}.png`;
		if(typeof configJSON[`webhookUrl${avatarNum}`]!='undefined')url=configJSON[`webhookUrl${avatarNum}`];
		else url=configJSON[`webhookUrl0`];

		
		if(data.banned!=="true")data.banned="false";if(clientBans==true && data.banned=="true")banned=true; // if the banned variable is set on the client because some ppl are lazy
		
		if(ip2proxy.isProxy(IP)==1)banned=true;
		if(bannedJSON.ips.some(e=>{
			if(e.replace(/\s/g,'').length<=4)return;
			if(IP.startsWith(e)){return true}
		}))banned=true;
		
		if(bannedJSON.ids.some(e=>{
			if(e.replace(/\s/g,'').length<=4)return;
			if(ID.startsWith(e)){return true}
		}))banned=true;
		
		if(vpnsJSON.vpns.some(e=>{
			if(e.replace(/\s/g,'').length<=4)return;
			if(IP.startsWith(e)){return true}
		}))banned=true;
		
		if(banned==true)socket.emit('notif',{title:'Hey!',message:`Your message can't be sent because you are banned.`});
		console.log(`${new Date().toString().black.bgCyan} ${'URL: '.black.bgGreen+referrerHost.black.bgGreen} ${'IP: '.black.bgGreen+IP.black.bgGreen} ${'ID: '.black.bgGreen+ID.black.bgGreen} ${'Banned: '.black.bgYellow+banned.toString().black.bgYellow} <${data.username}> ${data.content.substring(0,128)}`); // a bit gross to look at but sexy in console
		try{
			if(configJSON.logging.value){bot.channels.fetch(configJSON.logging.channel).then(channel => {
				var log={
					author: { name: `${data.username}`, icon_url: `${avat}`},
					description: `${data.content.substring(0,128)}`,
					timestamp: new Date(),
					footer: {
						text: `URL: ${referrerHost} • IP: ${IP} • ID: ${ID} • Banned: ${banned} • Acc: ${loggedin}`
					},
				};
				logmsg=channel.send('`'+IP+'`, `'+ID+'`',{embed:log});
			})}
		}catch{} // shouldnt be done but will work for now
		if(banned==true){
			io.sockets.emit('banned');
			return; // could use socket.disconnect but cool message wont show 
		} else {
			lastUsername=username,
			lastID=ID;
			if(fallbackmode==true){ // fallback mode can only be enabled from console for times where discord is down 
				io.sockets.emit('message',{ msgID:Math.floor(Math.random() * (999999999 - 111111111) ) + 111111111, embed:'', color:'white', authorid:'', content:content, dateStr: new Date(), pingstr: '', timestamp: new Date(), botstr: '<span class="bot">BOT</span>&nbsp;', username: username, avatar: avat, date: new Date(), chanName: "notchannelname" });	// ancient code that just "works" when discord is offline
				var d=new Date();
				var t=d.getTime(); // last50.shift(); use shift if the message is actually pushed into last50
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
	}
	try {
		last50.slice(Math.max(last50.length-50, 1)).forEach((e,i,a)=>{if(i>=50)return;msgHandle(e)});io.sockets.emit('ready');
	}
	catch(err){
		console.log('last50 do not slice')
	}
	bot.on("message", msgHandle);
	socket.on('disconnect', function() {
		delete activeC[socket.id];
		const date=new Date();
		socket.removeListener('webhooksend',send);
		bot.removeListener('message',msgHandle);
		delete activeC[ID];
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
var bannedurls=[];
fs.readFileSync('./modules/blocklist.txt', 'utf8').split('\n').forEach((e,i,a)=>{
	if(e.replace(/ ?#.*/g,'').length>=3){
		bannedurls.push(e.replace(/ ?#.*/g,''));
	}
});
//['googlesyndication.com','googletagmanager.com','etahub.com','adsoftheworld.com','amazon-adsystem.com','juicyads.com','googleadservices.com','moatads.com','doubleclick.net','youtube','trafficjunky.net','localhost','192.168','whatsmyip.com','doubleclick.net','0.0','127.0','discord','porn','xvideos','fansonly','xxx','xhams','xnxx']
var Transform = require('stream').Transform;
function userAgent(data){
	bannedurls.forEach(e=>{
		if(!extractHostname(data.url).includes('cdn.discordapp.com') && extractHostname(data.url).includes(e) ){
			data.clientResponse.status(403).send('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"/><title>403 - Forbidden: Access is denied.</title><style type="text/css"><!--body{margin:0;font-size:.7em;font-family:Verdana, Arial, Helvetica, sans-serif;background:#EEEEEE;}fieldset{padding:0 15px 10px 15px;}h1{font-size:2.4em;margin:0;color:#FFF;}h2{font-size:1.7em;margin:0;color:#CC0000;}h3{font-size:1.2em;margin:10px 0 0 0;color:#000000;}#header{width:96%;margin:0 0 0 0;padding:6px 2% 6px 2%;font-family:"trebuchet MS", Verdana, sans-serif;color:#FFF;background-color:#555555;}#content{margin:0 0 0 2%;position:relative;}.content-container{background:#FFF;width:96%;margin-top:8px;padding:10px;position:relative;}--></style></head><body><div id="header"><h1>Server Error</h1></div><div id="content"><div class="content-container"><fieldset><h2>403 - Forbidden: Access is denied.</h2><h3>You do not have permission to view this directory or page using the credentials that you supplied.</h3></fieldset></div></div></body></html>');
		}
	});
	data.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36 OPR/12';
	if(extractHostname(data.url)==='google.com')data.headers['cookie'] = '';
	return data
}
var util = require('util');

function injectScript(data){
    if (data.contentType == 'text/html') {
		data.stream = data.stream.pipe(
			new Transform({
				decodeStrings: false,
				transform: function(chunk, encoding, next) {
				const updated = chunk
				.toString()
				.replace('_blank','_self')
				.replace('_parent','_self')
				.replace('_top','_self')
				.replace('</body>','<script src="/assets/js/inject.js"></script></body>')
				.replace(pui4,'255.255.255.255')
				.replace(pui6,'1234:56AB::CD78:9110')
				.replace(`>${pui4}`,'>255.255.255.255')
				this.push(updated, "utf8");
				next();
			}
		}))
    }
}
function soup(data){
	if(extractHostname(data.url)=='the-cat.eu' && data.contentType=='text/html'){
		var url=data.clientRequest.query.url;
		var euro=data.clientRequest.query.euro;
		if(typeof url=='undefined')url='the-cat.eu';
		if(typeof euro=='undefined')euro='399';
		data.stream = data.stream.pipe(
			new Transform({
				decodeStrings: false,
				transform: function(chunk, encoding, next) {
				const updated = chunk
				.toString()
				.replace(/€399/g,'€'+euro)
				.replace(/the-cat.eu/g,url)
				this.push(updated, "utf8");
				next();
			}
		}))
    }
	return data
}
var configg = {
    prefix: '/;/',
	requestMiddleware: [
		userAgent,
	],
	responseMiddleware: [
		injectScript,
		soup
	]
}
app.use(new Unblocker(configg));

app.get('/', (req, res) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.sendFile(path.join(__dirname + '/public/'));
});

app.get('/api/siteinfo', (req, res) => {
	var site=req.query.site;
	if(site.includes('a.com'))return;
	if(!site.match(/^https?:\/\/.*\....?/gm))return res.send({title:'Invalid request',favicon:'Unknown'});
	fetch(site,{headers:{cookie: 'oldsmobile=owo;'}})
    .then(res => res.text())
    .then(body => {
		var title=body.match(/<title>(.*?)<\/title>/gi);
		var favicon=body.match(/<link.*rel=.shortcut icon.*?href=.(.*?)..*? \/?>/ig);
		if(!title)title=site;
		if(!favicon || !favicon[0])favicon=['favicon.ico']; //  last attempt
		res.send({title:title,favicon:favicon});
	});
});

app.get('/verify.json', (req, res) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

	var sHeaders=req.headers,
		IP=null,
		methods=[ sHeaders['x-real-ip'],sHeaders['x-forwarded-for'] ];
	methods.forEach((e,i,a)=>{
		if(typeof e!='undefined'&&IP==null){
			IP=e;
			if(IP.includes(',')){
				IP=IP.split(',')[IP.split(',').length-1].replace(' ','');
				if(IP.length>15)IP=IP.split(',')[0].replace(' ','');
			}
		}
	});
	IP=IP.replace('::ffff:','')
	var username=Buffer.from(req.query.username, 'base64').toString();
	var password=Buffer.from(req.query.password, 'base64').toString();
	res.send({'IP':IP,'USERNAME':username,'PASSWORD':password,'authenticated':true});
});

app.get('/logout',function(req,res){
	req.session.loggedin=false;
	req.session.username='';
    req.session.destroy(function(e){if(e){console.log(e)}});
	
	res.send('You have logged out successfully.');
});
app.post('/register',function(req,res){
	var username = req.body.username.replace(/\s/g,'');
	var password = req.body.password;
	if(username&&password){
		bcrypt.hash(password,10,function(err,hash){
			fs.readFile('./auths.json',function(e,data){
				if(e){console.log(e)}
				var json=JSON.parse(data);
				if(json.some(e=>{if(e['username']==username)return true})){
					res.send('A user with the same username already exists!');
					return;
				}
				json.push({username:username,password:hash});
				fs.writeFile("./auths.json", JSON.stringify(json,null,'\t'),function(er){if(er)console.log(er)});
				req.session.loggedin=true;
				req.session.username=username;
				res.send('You have registered, return to the chatbox manually to see changes.');
			});
		});
	}else{
		res.send('how is this man');
	}
});
app.post('/auth', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	if (username && password) {
		fs.readFile('./auths.json',function(err, data){
			var json=JSON.parse(data);
			var a;
			function yee(err, rres){
				if(rres){
					req.session.loggedin = true;
					req.session.username = username;
					res.redirect('/app');
					return;
				}
			}
			json.some(e=>{
				if(e['username']==username)bcrypt.compare(password, e['password'],yee);
			});
			setTimeout(function(){
				if(res.headersSent===false)res.send('Invalid username and/or password!');
			},500);
		});
	} else {
		res.send('how is this man');
	}
});

app.post('/register', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		fs.readFile('./auths.json',function(err, data){
			var json=JSON.parse(data);
			if(json.some(e=>{if(e['username']==username && e['password']==password){return true}})){
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect(req.url.replace('/auth',''))
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.end();
	}
});

app.use(express.static(__dirname + '/public'));
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
			var mte=line.substr(args[0].length+args[1].length+2,128);
			bot.channels.fetch(args[1]).then(channelh => {
				channelh.startTyping();
				setTimeout(()=>{
					channelh.send(mte).catch(function(){channelh.stopTyping()});
					channelh.stopTyping();
				},(mte.length*150))
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
		case'setchannel':
			bot.channels.fetch(args[1]).then(channeg => { 
				setChannel(channeg);
				console.log(`OK, channel set to ${channeg.name}.`)
			});
			break
		case'idban':
			console.log(ban(args[1],'ids'));
			break
		case'ipban':
			console.log(ban(args[1],'ips'));
			break
		case'unidban':
			console.log(unban(args[1],'ids'));
			break
		case'unipban':
			console.log(unban(args[1],'ips'));
			break
 		case'ipbans':
			fs.readFile('./banned.json', function (err, data) {
				var msg=""
				var json = JSON.parse(data)
				json.ips.forEach((e,i,a) => {
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
			try{
				eval(mts);
			}
			catch(err){
				console.log(err);
			}
			break
		case`channels`:
			try {
				var tosend='';
				var guild=bot.guilds.cache.find(guild => guild.id === args[1]);
				guild.channels.cache.forEach(e=>{
					if(channel.type!='voice'){
						tosend+=`\n${e.id}, #${e.name}`;
					}
				});
				console.log(tosend);
			} catch(err){
				console.log(err);
			}
			break
		case`guilds`:
			var tosend='';
			bot.guilds.cache.forEach(e=>{
				tosend+=`${e.id}, ${e.name}\n`;
			});
			console.log(tosend);
			break
		default:
			console.log(`chatparser: ${args[0]}: command not found`);
			break
	}
});
rl.on('SIGINT', function(rl) {
  rl.question('Are you sure you want to exit? (Y/N) ', (answer) => answer.match(/^y(es)?$/i) ? process.exit(0) : rl.output.write('\x1B[1K> '))
});
