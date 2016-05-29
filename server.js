/**
 * Created by serg on 26.05.2016.
 */

var server = require('http').createServer().listen(3333, "193.93.217.154", function(){
        console.log("SERVER IS UP");
    }),
    io = require('socket.io').listen(server);

io.on('connection', function(socket){

    socket.emit('connected',{current_socket_id:socket.id});
    console.log(socket.id+'connect');

    var agentnumber = socket.handshake.query.agentnumber;
    var telnethost = socket.handshake.query.telnethost;
    var telnetport = socket.handshake.query.telnetport;
    var telnetuser = socket.handshake.query.telnetuser;
    var telnetsecret = socket.handshake.query.telnetsecret;
    var current_socket_id = socket.handshake.query.current_socket_id;

    if(io.sockets.connected[current_socket_id]){
        io.sockets.connected[current_socket_id].disconnect();
    }

        var ami = new require('./asterisk-manager')(telnetport,telnethost,telnetuser,telnetsecret, true);


        if(!ami.isConnected()){
            socket.emit('error_asterisk_connect');
        }

        ami.keepConnected();

        ami.on('agentcalled', function(evt) {
            socket.emit('message',evt);
        });         

        socket.on('disconnect', function () {
            console.log(socket.id+'disconnected');
            socket.emit('disconnected');
            ami.action({
                'action':'logoff',
                'actionid':'3333'
            }, function(err, res) {
                console.log('ami disconnected');
            });
            
        });

});




