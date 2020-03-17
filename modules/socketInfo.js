const fs = require('fs');
function getIP(socket){
	var sHeaders=socket.handshake.headers, 
		IP=socket['ip'],
		cri=sHeaders['cf-real-ip'],
		cci=sHeaders['cf-connecting-ip'],
		//xff=sHeaders['x-forwarded-for'],
		xci=sHeaders['x-client-ip'];
		if(typeof cri!='undefined' && cri.length<=15){
			IP=cri
		}else if(typeof cci!='undefined' && cci.length<=15){
			IP=cci
		}else if(typeof xci!='undefined' && xci.length<=15){
			IP=csi
		}
		if(IP==='::ffff:127.0.0.1'){
			IP='127.0.0.1'
		}
	//fs.writeFile("./bruh.json"+IP, Object.entries(sHeaders),function(err){ if (err) throw err;});
	return IP
}
function getID(socket){
	var a=getIP(socket);
	var b=``;
	a.split(`.`).forEach(e => { b+=e.substr(0,1); });
	b+=a.replace('.','').substr(1,2);
	b=(Number(b)*2).toString();
	return b
}
module.exports.getIP=function(socket){return getIP(socket)};
module.exports.getID=function(socket){return getID(socket)};