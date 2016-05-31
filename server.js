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

    var mysql      = require('mysql'),
        connection = mysql.createConnection({
            host     : '193.93.216.11',
            user     : 'callc',
            password : 'sqlpassword',
            database : 'abills',
            port     : 3306
        });
    connection.connect();

    var phone = '673820246';
    connection.query('SELECT uid'+
        'FROM users_pi'+
        ' WHERE (phone like "%'+phone+'%")'+
        ' or (_phone_home like "%'+phone+'%")'+
        ' or (_phone_second like "%'+phone+'%")'+
        ' ORDER BY uid DESC',
        function(err, results){
            if (results){
                console.log(results);
            } else {
                console.log(err);
            }
        });

        var ami = new require('./asterisk-manager')(telnetport,telnethost,telnetuser,telnetsecret, true);

        ami.keepConnected();

        setInterval(function(){
            ami.action({
                'action': 'login',
                'username': telnetuser,
                'secret': telnetsecret
            }, function(err, res) {
                console.log('ami login',err, res);
            });
            socket.emit('error_asterisk_connect',{ami_status:ami_status});
            console.log(ami.login());
        }, 5000);

        ami.on('agentcalled', function(evt) {
            if (evt.agentname == agentnumber){
                var phone = evt.calleridnum;
                phone.slice( -9 );
                connection.query('SELECT uid'+
                                    'FROM users_pi'+
                                    ' WHERE (phone like "%'+phone+'%")'+
                                    ' or (_phone_home like "%'+phone+'%")'+
                                    ' or (_phone_second like "%'+phone+'%")'+
                                    ' ORDER BY uid DESC',
                    function(err, results){
                        if (results){
                            console.log(results);
                        }
                    });

                socket.emit('message',evt);
            }
        });



    socket.on('disconnect_this', function () {
            socket.disconnect();
            connection.end();
            ami.disconnect();
            /*ami.action({
                'action':'logoff',
                'actionid':'3333'
            }, function(err, res) {
                console.log('ami disconnected',err, res);
                socket.disconnect();
            });*/


            
        });

});




