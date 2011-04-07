/**
 *  Originally adapted from chat example socket.io.node
 *	This server should sync all clients and send OSC to the specified host.
 *	This server is currently designed to send any OSC address and supports two arguments.
 */

// Node.js required modules	
var fs = require('fs'),
    sys = require(process.binding('natives').util ? 'util' : 'sys'),
    url = require('url'),
    http = require('http'),
    path = require('path'),
    mime = require('mime'),
    io = require('socket.io'),
	server;

require.paths.unshift(__dirname + '/node-osc/lib');

var osc = require('osc');
// FIXME: implement the OSCServer on node-osc, so we will not need dgram here
var dgram = require('dgram');

// init some default params
var socketPort = 80;
var maxBufferStore = 50;
var oscAddress;

//declare buffer array
var buffer = [];

// create the web server
// this ends up serving pages from the server.prefix directory
// in this case, this is pointing to /web
server = http.createServer(function(req, res)
{
	//var path = url.parse(req.url).pathname;
	var path = this.prefix+url.parse(req.url).pathname;
	fs.readFile(__dirname + path, function(err, data)
	{
		console.log('serving ' + path);
		
		if (err) return send404(res);
		
		var type = 'text/html';

		if(path.indexOf('js') > -1) type = 'text/javascript';
		else if(path.indexOf('css') > -1) type = 'text/css';
		else if(path = "/explode_qr.html" setExplode();
		
		res.writeHead(200, {'Content-Type':type});
		res.write(data, 'utf8');
		res.end();
	});

}	
	
});

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};

// web server listens to the specified port
// so to hit this server, the url looks like server:port/page.html
server.listen(socketPort);

// set the web directory
server.prefix = '/web';

// init socket to the server for messaging
var io = io.listen(server);

// Set default OSCclient, this is the OSC "sender".
// This is currently set to localhost on an obscure port.
// You will change this, either dynamically from the client as done here,
// or statically as below to point OSC messages to your display app.
// It will look something more like (9000, 172.24.1.141)
var OSCclient = new osc.Client(11720, '127.0.0.1');

// this handler function is invoked when client connects to server
// all client "on" handler functions are created dynamically on socket connection
io.on('connection', function(client){
	// send stored message buffer to client
	client.send({ buffer: buffer });
	// broadcast connections to all clients										
	client.broadcast({ announcement: client.sessionId + ' connected' });	
  
	client.on('message', function(message){									
	// Handle the incoming messages coming from the client,
	// Again we are handling a finite message we know the structure of.
	// This is the structure for the test apps so it handles user ip/port/address config.
	// We will handle it differently in the final server apps.
	var msgAr = message.split(' ');
	
	//this code only handles the ip,port, address config for test client
	if (msgAr[0] == "oscconfig"){

		console.log("oscconfig message: "+msgAr[1], msgAr[2], msgAr[3]);
		if (msgAr[1] && msgAr[2] && msgAr[3]){
			OSCclient = new osc.Client(msgAr[3], msgAr[2]);
			
			//if the first param is a string then it's an OSC address
			if (msgAr[0].substring){
				oscAddress = msgAr[0];
			}else{
			}
		}
	}else if (msgAr[0] == "resetBuffer"){
		console.log("resetBuffer");
		//clear buffer 
		buffer.length = 0;
	}else{
	
	// Save the msg to the buffer, maxBufferStore is there to keep it smaller
	var msg = { message: [client.sessionId, message] };
	buffer.push(msg);
	if (buffer.length > maxBufferStore) buffer.shift();
    client.broadcast(msg);

	// construct the OSC message to send to the display application
	// again this is for a message where we know the intended structure (array of ints separated by spaces)
	var OSCargs = message.split(' ');
	
	//if the address has been set by the test client, then use that address and append OSCmsg starting at 0
	if (OSCargs[0].charAt(0) != "/"){
		OSCmsg = new osc.Message(oscAddress);
		
		for (i=0; i<OSCargs.length; i++) {
	       OSCmsg.append(parseInt(OSCargs[i]));
	    }
	
	}else{
		// otherwise the address will be coming as first element,
		// so use the socket message as the address and append starting at element 1
		OSCmsg = new osc.Message(OSCargs[0]);
		
		for (i=1; i<OSCargs.length; i++) {
	       OSCmsg.append(parseInt(OSCargs[i]));
	    }
	}
		
   	OSCclient.send(OSCmsg);
	console.log('sending OSC message: '+ OSCargs);
	
	}

  });

// On disconnect it broadcasts the disconnect to all clients. We don't really need this.
// clients are currently set up with a reconnect script that fires on disconnect.
// just keeps connecting forever, and ever, and ever... 
  client.on('disconnect', function(){
    client.broadcast({ announcement: client.sessionId + ' disconnected' });
	console.log(client.sessionId + ' disconnected');
  });
});
