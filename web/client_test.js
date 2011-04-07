// init the reconnect timer id
var reconnectId = "";

//set default number of buttons
var numButtons = 16;	
//create an array for buttons
var buttons = new Array();
// init a variable for button creation	
var buttonsCreated = false;
var oscAddress;

function createButtons(){
	
	// hide the loader gif
	document.getElementById('buttonDiv').style.backgroundImage = "none";
	
	// init all array values to 0 (off)
	for (i=0; i< numButtons; i++ ){
		buttons[i] = 0;
	}
	
	// create buttons
   for(var i = 0; i < numButtons; i++) {
	var bDiv = document.createElement('div');
	bDiv.className ='button';
	bDiv.id ='b_'+ i;
	document.getElementById("buttonDiv").appendChild(bDiv);
	var lDiv = document.createElement('div');
	lDiv.className ='label';
	lDiv.innerHTML = i;
	bDiv.appendChild(lDiv);
	
		//Assign event handlers by event support -- basic js version
		if ('ontouchstart' in document.documentElement) {
			bDiv.ontouchstart = function(){buttonClick(this);}
		}else{
			bDiv.onmousedown = function(){buttonClick(this);}
		}
	}
	buttonsCreated = true;
}

touchMove = function(event) {
// Prevent scrolling 
event.preventDefault();
}
touchStart = function(event) {
// Prevent scrolling 
event.preventDefault();
}

// button toggle
function buttonClick(elem){
	//num = elem.id.charAt(1);
 	num = elem.id.split('_')[1];
	console.log("button number: "+num+ " val: "+buttons[num]);
	if (buttons[num] == 0){
		//alert(num +" button off, turn on")
		buttonUpdate(num, 127, elem);
		socket.send(oscAddress + ' ' + num + ' 127');
	}else{
		//alert(num+" button off, turn on")
		buttonUpdate(num, 0, elem);
		socket.send(oscAddress + ' ' + num + ' 0');		
	}

}

function buttonUpdate(num, val, elem){
	//console.log("buttonUpdate"+num +" "+val);
	buttons[num] = val;
	if (!elem) elem = document.getElementById("b_"+num);
	if (val == 127) {	
		elem.style.backgroundColor = "#ffffff";	
	}else{
		elem.style.backgroundColor = "#000000";		
	}
}

function isInt(value) { 
	return !isNaN(parseInt(value)) && (parseFloat(value) == parseInt(value)); 
}

//
// socket.io
//

function message(obj){
	var el = document.createElement('p');
	if ('announcement' in obj) el.innerHTML = '<em>' + esc(obj.announcement) + '</em>';
	else if ('message' in obj) el.innerHTML = '<b>' + esc(obj.message[0]) + ':</b> ' + esc(obj.message[1]);
	
	// change the buttons on the client end when updates come from server
	// right now this just tests for messages that have integer as 2nd element
	// might need a better system of validating messages?
	
	if ('message' in obj){
	var msg = obj.message[1].split(' ');
		if(isInt(msg[1]) && isInt(msg[2])){
			console.log("send: "+msg[1], msg[2]);
			buttonUpdate(msg[1], msg[2]);
		}
	}
	
	if( obj.message && window.console && console.log ) console.log(obj.message[0], obj.message[1]);


	// in this version we only store the max buffer amount and remove the old ones
	if (document.getElementById('status').childNodes.length > maxBufferDisplay){
		document.getElementById('status').removeChild(document.getElementById('status').childNodes[0])
	}
		// add the messages to the list
		document.getElementById('status').appendChild(el);
		document.getElementById('status').scrollTop = 1000000;

}

function esc(msg){
	return msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


var maxBufferDisplay = 15;
var socket = new io.Socket(null, {port: socketPort, rememberTransport: false});


///// INIT FUNCTION ///////

function initClient(){
	
	if (document.getElementById('buttons')) numButtons = document.getElementById('buttons').value;	
	socket.connect();

	socket.on('message', function(obj){
		
		if ('buffer' in obj && !resetBuffer){
			console.log(resetBuffer);
		// buffer gets sent on connection
		//document.getElementById('form').style.display='block';
	
		//document.getElementById('status').innerHTML = '';
		//for (var i in obj.buffer) message(obj.buffer[i]);
	
			// only update the buttons in buffer, not messages
			for (var i in obj.buffer){
				console.log ("buffer: "+obj.buffer[i].message[1]);
				var msg = obj.buffer[i].message[1].split(' ');
				buttonUpdate(msg[1], msg[2]);
			}	
		resetBuffer = false;
		} else message(obj);
	});

	socket.on('connect', function(){
		if (reconnectId != "") clearInterval( reconnectId );
		//only do this once
		if (!buttonsCreated){
			createButtons();
			document.getElementById('status').innerHTML = '';
			message({ message: ['System', 'Connected']})
		
			var oscConfig = new Array(document.getElementById('address').value, document.getElementById('ip').value, document.getElementById('port').value);
			console.log("oscConfig: "+oscConfig[0], oscConfig[1], oscConfig[2]);
			socket.send('oscconfig ' + oscConfig[0] +' '+ oscConfig[1]+' '+oscConfig[2]);
			if (oscConfig[0].charAt(0) == "/") oscAddress = oscConfig[0];
			
			if (resetBuffer){
			socket.send('resetBuffer');	
			}
		}
	});

	socket.on('disconnect', function(){
	
		// clear the list
		document.getElementById('status').innerHTML = '';
	
		// create the entry and add to the list
		var el = document.createElement('p');
		el.innerHTML= "<h2><b><font color = 'red'>DISCONNECTED.</color> RECONNECTING...</b></h2>";
		document.getElementById('status').appendChild(el);
	
		//message({ message: ['System', 'Disconnected']});
		//alert ("Disconnected. Press OK to reconnect.");
		reconnectId  = setInterval("reconnectSocket()", 2000);
	});

	socket.on('reconnect', function(){ message({ message: ['System', 'Reconnected to server']})});
	socket.on('reconnecting', function( nextRetry ){ message({ message: ['System', 'Attempting to re-connect to the server, next attempt in ' + nextRetry + 'ms']})});
	socket.on('reconnect_failed', function(){ message({ message: ['System', 'Reconnected to server FAILED.']})});

}
function reconnectSocket(){
	socket.connect();
	console.log("socket reconnecting...");
}
