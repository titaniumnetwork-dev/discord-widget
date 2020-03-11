function getIP(socket){
	var sHeaders=socket.handshake.headers, 
		IP=socket['ip'],
		cri=sHeaders['CF-Real-IP'],
		cci=sHeaders['CF-Connecting-IP'],
		xff=sHeaders['x-forwarded-for'],
		xci=sHeaders['x-client-ip'],
		sha=socket.handshake.address;
	if(sHeaders['host'].includes('localhost')){
		IP='127.0.0.1'
	} else if(IP.split(',')[0].length>16){
		IP=IP.split(',')[1].trim();
	} else {
		IP=(cri||cci||xff.replace(' ','')||xci||sha).split(',')[0].trim();
	}
	/*if(sheaders['CF-Real-IP']){
		IP=sheaders['CF-Real-IP'];
	} else if(c.length>=15){
		a=c
	} else if(typeof d != 'undefined'){
		if(d.split(',')[0].length<=15){
			a=d.split(',')[0]
		} else if(d.split(',')[1].length<=15)  {
			a=d.split(',')[1]
		}
	} else if(typeof e != 'undefined' && e.length>=15){
		a=e
	} else if(typeof f != 'undefined' && f.length>=15){
		a=f
	}*/
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