/**
 * Created by serg on 26.05.2016.
 */

var server = require('http').createServer().listen(3333, "193.93.217.154", function(){
        console.log("SERVER IS UP");
    }),
    io = require('socket.io').listen(server);

io.on('connection', function(socket){

    socket.emit('connected',{current_socket_id:socket.id});
    console.log(socket.id+' - connected');

    var agentnumber = socket.handshake.query.agentnumber;
    var telnethost = socket.handshake.query.telnethost;
    var telnetport = socket.handshake.query.telnetport;
    var telnetuser = socket.handshake.query.telnetuser;
    var telnetsecret = socket.handshake.query.telnetsecret;
    var current_socket_id = socket.handshake.query.current_socket_id;
    

    if(!agentnumber || !telnethost || !telnetport || !telnetuser || !telnetsecret){      
        socket.emit('connect_error');
    }

        var ami = new require('./asterisk-manager')(telnetport,telnethost,telnetuser,telnetsecret, true);

        ami.keepConnected();

        console.log(ami);

        /*setInterval(function(){
            var ami_status = ami.isConnected();
            socket.emit('error_asterisk_connect',{ami_status:ami_status});
        }, 5000);*/

        ami.on('agentcalled', function(evt) {
            if (evt.agentname == agentnumber){
                socket.emit('message',evt);
            }
        });         

        socket.on('disconnect', function () {
            socket.disconnect();
            ami.action({
                'action':'logoff',
                'actionid':'3333'
            }, function(err, res) {
                console.log('ami disconnected');
            });
            
        });

});




