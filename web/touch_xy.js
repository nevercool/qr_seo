var canvasInited = false;

function canvasInit(){
	console.log("canvasInit");
    var canvas = document.getElementById('test');
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        var draw = false;
		
		var tDiv = document.getElementById("test");
		
		if ('ontouchstart' in document.documentElement) {
			tDiv.ontouchstart = function(e){
				draw = true;
				drawTouch(e, ctx);
			}
			tDiv.ontouchend = function(e){
				draw = false;
			}
			tDiv.ontouchmove= function(e){
				if (draw) {
					drawTouch(e, ctx);
	            }
			}
		}else{
			tDiv.onmousedown = function(e){
				draw = true;
				drawTouch(e, ctx);
			}
			tDiv.onmouseup = function(e){
				draw = false;
			}
			tDiv.onmousemove= function(e){
				if (draw) {
					drawTouch(e, ctx);
	            }
			}
		}
    }
	canvasInited = true;
}

// button toggle
function drawTouch(e) {
	//console.log(e);
		var x, y;
		if ('ontouchstart' in document.documentElement) {
	       	x = e.targetTouches[0].pageX;
	        y = e.targetTouches[0].pageY;
		}else{
			x = e.pageX;
	        y = e.pageY;	
		}
			
		canvasUpdate(x, y, ctx);
		socket.send(x+' '+y);
}

function canvasUpdate(x, y){
	//ctx.fillStyle = "rgba(255,255,255,.6)";
  	ctx.clearRect(0, 0, 420, 300);
    //ctx.fill();
    ctx.fillStyle = "rgba(255,0,0,1)";
    ctx.beginPath();
    ctx.arc(x - 15, y - 15, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
	console.log(x, y);
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
	canvasUpdate(msg[0], msg[1]);
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

var maxBufferDisplay = 15;
var socket = new io.Socket(null, {port: socketPort, rememberTransport: false});


///// INIT FUNCTION ///////

function initClient(){
	
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
				canvasUpdate(msg[0], msg[1]);
			}	

		} else message(obj);
	});

	socket.on('connect', function(){
		if (!canvasInited){
			canvasInit();
			document.getElementById('status').innerHTML = '';
			 message({ message: ['System', 'Connected']})
		
			var oscConfig = new Array(document.getElementById('ip').value, document.getElementById('port').value, document.getElementById('address').value);
			console.log("oscConfig: "+oscConfig[0], oscConfig[1]);
			socket.send('oscconfig ' + oscConfig[0] +' '+ oscConfig[1]+' '+oscConfig[2]);
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
		setTimeout("socket.connect()", 2000);
	});

	socket.on('reconnect', function(){ message({ message: ['System', 'Reconnected to server']})});
	socket.on('reconnecting', function( nextRetry ){ message({ message: ['System', 'Attempting to re-connect to the server, next attempt in ' + nextRetry + 'ms']})});
	socket.on('reconnect_failed', function(){ message({ message: ['System', 'Reconnected to server FAILED.']})});

}

