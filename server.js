/**
 *  Addapted from chat example socket.io.node
 *	This server should sync all clients and send OSC to the specified host.
 */

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
var socketPort = 9000;

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
		
		res.writeHead(200, {'Content-Type':type});
		res.write(data, 'utf8');
		res.end();
	});
});

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};


server.listen(socketPort);
server.prefix = '/web';

// socket.io, I choose you
var io = io.listen(server)
  , buffer = [];
  
io.on('connection', function(client){
  client.send({ buffer: buffer });
  client.broadcast({ announcement: client.sessionId + ' connected' });

var OSCclient = new osc.Client(11720, '127.0.0.1');
  
  client.on('message', function(message){
	//console.log("message from client");
	var msg = { message: [client.sessionId, message] };
	buffer.push(msg);
	if (buffer.length > 30) buffer.shift();
    client.broadcast(msg);
	
	
	var OSCargs = message.split(' ');
	OSCmsg = new osc.Message('/button');
	for (i=0; i<OSCargs.length; i++) {
       OSCmsg.append(parseInt(OSCargs[i]));
    } 
    OSCclient.send(OSCmsg);
    console.log(msg);
	console.log('OSC message: ' + OSCmsg.address + ' ' + OSCargs);

    /*
	var msg = { message: [client.sessionId, message] };
    buffer.push(msg);
    if (buffer.length > 15) buffer.shift();
    client.broadcast(msg);
	*/
  });

  client.on('disconnect', function(){
    client.broadcast({ announcement: client.sessionId + ' disconnected' });
	console.log(client.sessionId + ' disconnected');
  });
});
