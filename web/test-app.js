//set all buttons to off to start
var buttons = new Array(0,0,0,0);
var socketPort = 9000;

// button toggle
function buttonClick(elem){
	num = elem.id.charAt(1);
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
	buttons[num] = val;
	if (!elem) elem = document.getElementById("b"+num);
	if (val == 127) {	
		elem.style.backgroundColor = "#ffffff";	
	}else{
		elem.style.backgroundColor = "#000000";		
	}
}

function isInt(value) { 
	return !isNaN(parseInt(value)) && (parseFloat(value) == parseInt(value)); 
}

// this is a version without jquery for debugging. jquery would be better overall 
// to access and toggle elements, handling the socket sending/listening
// it does add some load time and a tad more complexity however...


//
// socket.io
//

function message(obj){
	var el = document.createElement('p');
	if ('announcement' in obj) el.innerHTML = '<em>' + esc(obj.announcement) + '</em>';
	else if ('message' in obj) el.innerHTML = '<b>' + esc(obj.message[0]) + ':</b> ' + esc(obj.message[1]);
	
	// change the buttons on the client end when updates come from server
	// right now this just tests for messages that have integer as 2nd element
	
	if ('message' in obj && isInt(obj.message[1])){
	var msg = obj.message[1].split(' ');
	buttonUpdate(msg[0], msg[1]);
	}
	
	if( obj.message && window.console && console.log ) console.log(obj.message[0], obj.message[1]);


	// in this version we only store the max buffer amount and remove the old ones
	if (document.getElementById('status').childNodes.length > 15){
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

var socket = new io.Socket(null, {port: socketPort, rememberTransport: false});
socket.connect();

socket.on('message', function(obj){
	if ('buffer' in obj){
	// buffer gets sent on connection
	//document.getElementById('form').style.display='block';
	
	//document.getElementById('status').innerHTML = '';
	//for (var i in obj.buffer) message(obj.buffer[i]);
	
		// only update buttons in buffer, not messages
		for (var i in obj.buffer){
			var msg = obj.buffer[i].message[1].split(' ');
			buttonUpdate(msg[0], msg[1]);
		}	

	} else message(obj);
});

socket.on('connect', function(){
	document.getElementById('status').innerHTML = '';
	 message({ message: ['System', 'Connected']})
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



