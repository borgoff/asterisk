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

    var dbhost = socket.handshake.query.dbhost;
    var dbuser = socket.handshake.query.dbuser;
    var dbsecret = socket.handshake.query.dbsecret;
    var dbname = socket.handshake.query.dbname;
    var dbport = socket.handshake.query.dbport;
    

    if(!agentnumber || !telnethost || !telnetport || !telnetuser || !telnetsecret || !dbhost || !dbuser || !dbsecret){      
        socket.emit('no_options');
        socket.emit('disconnect_this');
    }

    var mysql      = require('mysql'),
        connection = mysql.createConnection({
            host     : dbhost,
            user     : dbuser,
            password : dbsecret,
            database : dbname,
            port     : dbport
        });

    connection.connect(function(err) {
      if (err) {
        socket.emit('error_connect',{msg:'Incorrect DB options'});
        socket.emit('disconnect_this');
        return;
      }
    });

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
        socket.emit('error_connect',{msg:'Incorrect host or port'});
        socket.emit('disconnect_this');
    });
    nami.on('namiLoginIncorrect', function () {
        socket.emit('error_connect',{msg:'Incorrect login or password'});
        socket.emit('disconnect_this');
    });
    nami.open();

    socket.on('disconnect_this', function () {            
            nami.close();
            connection.end();
            socket.disconnect();
        });

});




