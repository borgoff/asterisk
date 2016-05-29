/**
 * Created by serg on 26.05.2016.
 */

var server = require('http').createServer().listen(3333, "193.93.217.154", function(){
        console.log("SERVER IS UP");
    }),
    io = require('socket.io').listen(server);

io.on('connection', function(socket){

    var agentnumber = socket.handshake.query.agentnumber;
    var telnethost = socket.handshake.query.telnethost;
    var telnetport = socket.handshake.query.telnetport;
    var telnetuser = socket.handshake.query.telnetuser;
    var telnetsecret = socket.handshake.query.telnetsecret;

        var ami = new require('./asterisk-manager')(telnetport,telnethost,telnetuser,telnetsecret, true);


        if(!ami.isConnected()){
            socket.emit('error_asterisk_connect');
            socket.disconnect();
            console.log(socket.id+'closed');
        } else {

            ami.keepConnected();

            ami.on('agentcalled', function(evt) {
                socket.emit('message',evt);
            });

            socket.emit('connected');

            socket.on('change_options_reconnect',function(){            
                socket.disconnect();
                ami.action({
                    'action':'logoff',
                    'actionid':'3333'
                }, function(err, res) {
                    console.log('ami disconnected');
                });
                console.log(socket.id+'closed');
            });

            console.log(socket.id+'connect');

            socket.on('disconnect', function () {
                socket.emit('disconnected');
                ami.action({
                    'action':'logoff',
                    'actionid':'3333'
                }, function(err, res) {
                    console.log('ami disconnected');
                });
                
            });
        }

});




