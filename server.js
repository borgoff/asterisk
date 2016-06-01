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
    console.log(connection);

    //testing connection--------------------
    /*connection.query('SELECT uid'+
        ' FROM users_pi'+
        ' WHERE (phone LIKE "%673820246%")'+
        ' or (_phone_home LIKE "%673820246%")'+
        ' or (_phone_second LIKE "%673820246%")'+
        ' ORDER BY uid DESC LIMIT 1',
        function(err, results){
            if (results){
                connection.query('SELECT users.id, users_pi.fio, bills.deposit, users.credit, tarif_plans.name, groups.name, districts.name, streets.name, builds.number, users_pi.address_flat'+
                ' FROM (users'+
                ' left join users_pi on users.uid = users_pi.uid'+
                ' left join bills on users.uid = bills.uid'+
                ' left join dv_main on dv_main.uid = users.uid )'+
                ' left join tarif_plans on dv_main.tp_id = tarif_plans.id'+
                ' left join groups on users.gid = groups.gid'+
                ' left join builds on users_pi.location_id = builds.id'+
                ' left join streets on builds.street_id = streets.id'+
                ' left join districts on streets.district_id = districts.id'+
                ' WHERE users.uid = '+results.uid,
                    function(err2, results2){
                        if (results2){
                            socket.emit('message',results2);
                        }
                        if (err2){
                            socket.emit('message',err2);
                        }
                    });
            }
            if (err){
                socket.emit('message',err);
            }
        });*/
    //---------testing connection

    var namiConfig = {
        host: telnethost,
        port: telnetport,
        username: telnetuser,
        secret: telnetsecret,
        event:'off'
    };

    var nami = new (require("nami").Nami)(namiConfig);

    nami.on('namiEventAgentCalled', function (event) {
        if (event.agentname == agentnumber){
        var phone = event.calleridnum;
            phone.slice( -9 );
            connection.query('SELECT uid'+
                ' FROM users_pi'+
                ' WHERE (phone like "%'+phone+'%")'+
                ' or (_phone_home like "%'+phone+'%")'+
                ' or (_phone_second like "%'+phone+'%")'+
                ' ORDER BY uid DESC LIMIT 1',
                function(err, results){
                    if (results){
                        socket.emit('message',results);
                        console.log(results);
                    }
                    if (err){
                        socket.emit('message',err);
                        console.log(err);
                    }
                });
        }
    });
    nami.on('namiConnectionError', function (event) {
        console.log('Error - ',event.event);
        socket.emit('error_asterisk_connect',{msg:'Incorrect host or port'});
    });
    nami.on('namiLoginIncorrect', function () {
        console.log('INCORRECT');
        socket.emit('error_asterisk_connect',{msg:'Incorrect login or password'});
    });
    nami.open();

    /*var action = new namiLib.Actions.Events();
    action.variables = {
        'EventMask': 'agent'
    };
    nami.send(action, function(response) {
        console.log(response);
    });*/

    /*

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
        });*/

        //var ami = new require('./asterisk-manager')(telnetport,telnethost,telnetuser,telnetsecret, true);

        //ami.keepConnected();
        //console.log(ami);

        /*setInterval(function(){
            ami.action({
                'action': 'login',
                'username': telnetuser,
                'secret': telnetsecret
            }, function(err, res) {
                console.log('ami login',err, res);
            });
            //socket.emit('error_asterisk_connect',{ami_status:ami_status});
        }, 5000);

        ami.on('agentcalled', function(evt) {
            if (evt.agentname == agentnumber){
                /!*var phone = evt.calleridnum;
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
                    });*!/

                socket.emit('message',evt);
            }
        });*/



    socket.on('disconnect_this', function () {
            socket.disconnect();
            nami.close();
            //connection.end();
            //ami.disconnect();
            /*ami.action({
                'action':'logoff',
                'actionid':'3333'
            }, function(err, res) {
                console.log('ami disconnected',err, res);
                socket.disconnect();
            });*/


            
        });

});




