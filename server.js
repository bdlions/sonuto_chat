//server url and port
var SERVER_ROOT_URL = "http://127.0.0.1/sportzweb/";
var SERVER_PORT = 8082;

//initialize server
var express = require('express')
, app = express()
, http = require('http')
, server = http.createServer(app)
, request = require('request')
, io = require('socket.io').listen(server);

//start server
server.listen(SERVER_PORT);

//hide server files with routing
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});

console.log("server listen in port " + SERVER_PORT);

io.sockets.on('connection', function (socket) {
	//console.log("A new user is connecting with the server in port " + SERVER_PORT);
	socket.on('adduser', function(userInfo){
		userInfo = JSON.parse(userInfo);
		socket.userInfo = userInfo;
		//console.log(userInfo.roomId);
		socket.username = userInfo.firstName + userInfo.lastName;
		socket.room = userInfo.roomId;

		socket.join(userInfo.roomId);
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		//console.log("Chat message: " + data);
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendmessage', function (messageInfo) {		
		//console.log(messageInfo);
		var formData = {
				// Pass a simple key-value pair
				messageInfo: messageInfo
		};
		request.post({url: SERVER_ROOT_URL + 'chat_nodejs/app_xstream_banter/store_chat_message', formData: formData}, function optionalCallback(err, httpResponse, result) {
			console.log(result);
			messageInfo = JSON.parse(messageInfo);
			io.sockets.in(socket.room).emit('updatemessages', result);
		});
	});
	
	socket.on('messagechatinitialize', function(userInfo){
		userInfo = JSON.parse(userInfo);
		//socket.userInfo = userInfo;
		var senderId = userInfo.senderId;
		var receiverId = userInfo.receiverId;
		var messageChatIdentifier = 0;
		if(senderId < receiverId)
		{
			messageChatIdentifier = senderId+'_'+receiverId;
		}
		else
		{
			messageChatIdentifier = receiverId+'_'+senderId;
		}
		//console.log(messageChatIdentifier);
		//socket.username = userInfo.firstName + userInfo.lastName;
		socket.messageChatIdentifier = messageChatIdentifier;
		socket.join(messageChatIdentifier);
	});
	socket.on('sendmessagechat', function (messageInfo) {		
		//console.log(messageInfo);
		var formData = {
				// Pass a simple key-value pair
				messageInfo: messageInfo
		};
		request.post({url: SERVER_ROOT_URL + 'chat_nodejs/message_chat/store_chat_message', formData: formData}, function optionalCallback(err, httpResponse, result) {
			//console.log(result);
			messageInfo = JSON.parse(messageInfo);
			io.sockets.in(socket.messageChatIdentifier).emit('updatemessagecchat', result);
		});
	});
});


