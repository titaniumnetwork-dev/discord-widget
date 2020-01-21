var last50={};
if(typeof exports == "undefined"){
    exports = this;
}

const loggee = (yes) => {
    console.log(yes);
};
const definelast50 = (newlast50) => {
	last50=newlast50;
	console.log('thank');
}

const writelast50 = () => {
	var towrite; // predefine towrite
	for (let i = 0; i < last50.length; i++) { // you loop through them
		var curr = last50[i];
		var username=sanitizeHtml(curr.author.username)
		var avatarURL="https://bibles.ml/login/?cdURL="+curr.author.avatarURL+"?size=128";
		if (avatarURL==="https://bibles.ml/login/?cdURL=null?size=128")avatarURL="https://bibles.ml/login/?cdURL=https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png";
		towrite+=`
		<div class="message">
			<img src="`+avatarURL+`" class="avatar"></img>
			<a class="name">`+sanitizeHtml(curr.author.username)+`</a>
			<p class="content">`+sanitizeHtml(curr.content)+`</p>
			</div><hr class="discord">`;
	}
	document.getElementsByClassName(`messages`)[0].innerHTML=towrite; // write to the document
};


exports.loggee = loggee;
exports.writelast50 = writelast50;
exports.definelast50 = definelast50;