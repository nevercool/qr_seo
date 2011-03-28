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
	
//require('./node-dirty/test/common');
var db = require('dirty')('user.db');
//var db = require('./node-dirty/lib/dirty')

//called when records are written
db.on('drain', function() {
  console.log('All records are saved on disk now.');
});
	

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
		if (err) return send404(res);

		var type = 'text/html';

		if(path.indexOf('js') > -1) type = 'text/javascript';
		else if(path.indexOf('css') > -1) type = 'text/css';
		
		//////// test saving a hit to a specific page
		var p = url.parse(req.url).pathname;
		if (p == "/test-fid.html"){
			
			var currentTime = new Date();
			var hours = currentTime.getHours();
			var minutes = currentTime.getMinutes();
			
			var fidCount = 0;
			
			db.set('fid', {time: hours+":"+minutes}, function(key, val) {
				console.log('Added fid, time of add is %s.', db.get('fid').time);
				
				db.forEach(function(key, val) {
				    if (key == 'fid'){
						fidCount++;
					}
				});
				console.log('fidCount= '+fidCount);
				
			});	
		  }
		///////////// end page handlers
		
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
server.prefix = '/web/';

// socket.io, I choose you
var io = io.listen(server)
  , buffer = [];
  
io.on('connection', function(client){
  client.send({ buffer: buffer });
  client.broadcast({ announcement: client.sessionId + ' connected' });

var OSCclient = new osc.Client(11720, '127.0.0.1');

var currentTime = new Date();
var hours = currentTime.getHours();
var minutes = currentTime.getMinutes();

//add the document and set the callback
	db.set(client.sessionId, {time: hours+":"+minutes}, function(key, val) {
		console.log('Added ' + client.sessionId + ' time of add is %s.', db.get(client.sessionId).time);
	});

	/*db.forEach(function(key, val) {
	    console.log('Found key: %s, val: %j', key, val);
	});*/


  client.on('message', function(message){
	//console.log("message from client");
	var msg = { message: [client.sessionId, message] };
	buffer.push(msg);
	if (buffer.length > 15) buffer.shift();
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
