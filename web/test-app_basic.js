
//set number of buttons
var numButtons = 16;	
//create an array for buttons
var buttons = new Array();
// init a variable for button creation	
buttonsCreated = false;

function createButtons(){
	//init all array values to 0 (off)
	for (i=0; i< numButtons; i++ ){
		buttons[i] = 0;
	}
	
   for(var i = 0; i < numButtons; i++) {

	var bDiv = document.createElement('div');
	bDiv.className ='button';
	bDiv.id ='b_'+ i;
	document.getElementById("buttonDiv").appendChild(bDiv);
	var lDiv = document.createElement('div');
	lDiv.className ='label';
	lDiv.innerHTML = i;
	bDiv.appendChild(lDiv);
	
		//Assign event handlers, basic js version
		//var button = document.getElementById('b_'+ i);
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
		socket.send(num + ' 127');
	}else{
		//alert(num+" button off, turn on")
		buttonUpdate(num, 0, elem);
		socket.send(num + ' 0');		
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
	
	if ('message' in obj && isInt(obj.message[1])){
	var msg = obj.message[1].split(' ');
	buttonUpdate(msg[0], msg[1]);
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

/*
function send(){
var val = document.getElementById('text').value;
socket.send(val);
message({ message: ['you', val] });
document.getElementById('text').value = '';
}

*/

var socketPort = 9000;
var maxBufferDisplay = 15;
var socket = new io.Socket(null, {port: socketPort, rememberTransport: false});


///// INIT FUNCTION ///////

function initClient(){

numButtons = document.getElementById('buttons').value;		
	socket.connect();

	socket.on('message', function(obj){
		if ('buffer' in obj){
		// buffer gets sent on connection
		//document.getElementById('form').style.display='block';
	
		//document.getElementById('status').innerHTML = '';
		//for (var i in obj.buffer) message(obj.buffer[i]);
	
			// only update the buttons in buffer, not messages
			for (var i in obj.buffer){
				var msg = obj.buffer[i].message[1].split(' ');
				buttonUpdate(msg[0], msg[1]);
			}	

		} else message(obj);
	});

	socket.on('connect', function(){
		console.log("buttonsCreated "+buttonsCreated)
		if (!buttonsCreated){
			createButtons();
		}
		document.getElementById('status').innerHTML = '';
		 message({ message: ['System', 'Connected']})
		
		var oscConfig = new Array(document.getElementById('ip').value, document.getElementById('port').value);
		console.log("oscConfig: "+oscConfig[0], oscConfig[1]);
		socket.send('oscconfig ' + oscConfig[0] +' '+ oscConfig[1]);
		
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
		setTimeout("socket.connect()", 2000);
	});

	socket.on('reconnect', function(){ message({ message: ['System', 'Reconnected to server']})});
	socket.on('reconnecting', function( nextRetry ){ message({ message: ['System', 'Attempting to re-connect to the server, next attempt in ' + nextRetry + 'ms']})});
	socket.on('reconnect_failed', function(){ message({ message: ['System', 'Reconnected to server FAILED.']})});

}



