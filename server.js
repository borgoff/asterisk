/**
 * Created by serg on 26.05.2016.
 */

var server = require('http').createServer().listen(3333, "193.93.217.154", function(){
        console.log("SERVER IS UP");
    }),
    io = require('socket.io').listen(server);

io.on('connection', function(socket){

    var calling_queue = [];

    socket.emit('connected',{current_socket_id:socket.id});

    var agentnumber = socket.handshake.query.agentnumber;
    var telnethost = socket.handshake.query.telnethost;
    var telnetport = socket.handshake.query.telnetport;
    var telnetuser = socket.handshake.query.telnetuser;
    var telnetsecret = socket.handshake.query.telnetsecret;

    var dbhost = socket.handshake.query.dbhost;
    var dbuser = socket.handshake.query.dbuser;
    var dbsecret = socket.handshake.query.dbsecret;
    var dbname = socket.handshake.query.dbname;
    var dbport = parseInt(socket.handshake.query.dbport);
    

    if(!agentnumber || !telnethost || !telnetport || !telnetuser || !telnetsecret || !dbhost || !dbuser || !dbsecret || !dbname || !dbport){      
        socket.emit('no_options');
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
        return;
      }
    });

    var namiConfig = {
        host: telnethost,
        port: telnetport,
        username: telnetuser,
        secret: telnetsecret
    };

    var nami = new (require("nami").Nami)(namiConfig);

    /*nami.on('namiEventAgentRingNoAnswer', function (event) {
        socket.emit('message',event);
        var ar_index = calling_queue.indexOf(event.uniqueid);
        if(ar_index != -1){
            calling_queue = calling_queue.splice(ar_index,1);
        }
    });*/

    nami.on('namiEventAgentConnect', function (event) {
        var ar_index = calling_queue.indexOf(event.uniqueid);
        if(ar_index != -1){
            calling_queue = calling_queue.splice(ar_index,1);
        }
    });

    nami.on('namiEventAgentDump', function (event) {
        var ar_index = calling_queue.indexOf(event.uniqueid);
        if(ar_index != -1){
            calling_queue = calling_queue.splice(ar_index,1);
        }
        socket.emit('remove_message',{uniqueid:event.uniqueid});
    });
    nami.on('namiEventAgentComplete', function (event) {
        var ar_index = calling_queue.indexOf(event.uniqueid);
        if(ar_index != -1){
            calling_queue = calling_queue.splice(ar_index,1);
        }
        socket.emit('remove_message',{uniqueid:event.uniqueid});
    });

    nami.on('namiEventAgentCalled', function (event) {
        if (event.agentname == agentnumber){
            if(calling_queue.indexOf(event.uniqueid) == -1){
                calling_queue.push(event.uniqueid);
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
                                if(results.length > 0){
                                    connection.query('SELECT users.id as user_id, users_pi.fio as user_fio, bills.deposit as user_deposit, users.credit as user_credit, tarif_plans.name as user_plan_name, groups.name as user_group_name, districts.name as user_district_name, streets.name as user_street_name, builds.number as user_bild_number, users_pi.address_flat as user_flat_number'+
                                        ' FROM (users'+
                                        ' left join users_pi on users.uid = users_pi.uid'+
                                        ' left join bills on users.uid = bills.uid'+
                                        ' left join dv_main on dv_main.uid = users.uid )'+
                                        ' left join tarif_plans on dv_main.tp_id = tarif_plans.id'+
                                        ' left join groups on users.gid = groups.gid'+
                                        ' left join builds on users_pi.location_id = builds.id'+
                                        ' left join streets on builds.street_id = streets.id'+
                                        ' left join districts on streets.district_id = districts.id'+
                                        ' WHERE users.uid = '+results[0].uid,
                                        function(err2, results2){
                                            console.log(err2, results2);
                                            if (results2){
                                                results2[0]['user_phone'] = phone;
                                                results2[0]['uniqueid'] = event.uniqueid;
                                                socket.emit('message',results2[0]);
                                            }
                                            if (err2){
                                                socket.emit('error_connect',{msg:'Incorrect DB query'});
                                            }
                                        });
                                } else {
                                    socket.emit('message',{unknown_user:1, user_phone:phone, uniqueid:event.uniqueid});
                                }
                            }
                            if (err){
                                socket.emit('error_connect',{msg:'Incorrect DB query'});
                            }
                        });
            }
        }
    });
    nami.on('namiConnectionError', function (event) {
        socket.emit('error_connect',{msg:'Incorrect host or port'});
    });
    nami.on('namiLoginIncorrect', function () {
        socket.emit('error_connect',{msg:'Incorrect login or password'});
    });
    nami.open();

    socket.on('disconnect_this', function () {            
            socket.disconnect();
            nami.close();
            connection.end();
        });

});




