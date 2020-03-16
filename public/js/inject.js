var overlay=true;
$(document).keydown(function(event) {
	var parentdoc=top;
	if (event.which == "17")
		cntrlIsPressed = true;
	else if (event.which == 77 && cntrlIsPressed) {
		console.log('hi')
	  if (parentdoc.document.getElementById('rusic-modal').style.display !== "none"){
		  parentdoc.document.getElementById('rusic-modal').style.display="none";
		  if(overlay===true){
			parentdoc.document.getElementsByClassName('overlay')[0].style.display="none";
		  }
	  } else {
		parentdoc.document.getElementById('rusic-modal').style.display="initial";
		if(overlay===true){
			parentdoc.document.getElementsByClassName('overlay')[0].style.display="initial";
		}
	  }
	  cntrlIsPressed=false;
	} else {
		cntrlIsPressed=false;
	}
});