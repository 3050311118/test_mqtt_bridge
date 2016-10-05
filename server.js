var mqtt    = require('mqtt');
var net     = require('net');

tcpserver=net.createServer(function(socket) {
	var mqttclient;
    var messagCount=0;//第一次发数据需要得到模块唯一ID
    var messageData;  //上传的数据
    var SN;           //序列号

    socket.setNoDelay(true);//不使用延时
    var res={error:0,msg:"connected"};//连接成功反馈
    var resStr=JSON.stringify(res);
    socket.write(resStr);

    socket.on('data', function(data) {
        messageData=data.toString();
        if(messagCount===0)   //注册设备
        {
            messagCount=1;
            SN=messageData;   //第一次序列号
            if(SN.indexOf("SN") !=0)
            {
        	    var res={error:6,msg:"registerErr"};
			    var resStr=JSON.stringify(res);
			    socket.write(resStr);
			    socket.end();
			    return;
            }else
            {
            	var res={error:0,msg:"registerOK"};
			    var resStr=JSON.stringify(res);
			    socket.write(resStr);
            }

			mqttclient  = mqtt.connect('mqtt://www.hhlab.cn');
			mqttclient.on('connect', function () {
			   mqttclient.subscribe(SN);
			});
			mqttclient.on('message', function (topic, message) {
			   socket.write(message);
			});
			mqttclient.on('error',function(err){
			   socket.write("err");
       		});
         }else
        {//上传数据
        	var messageArr=messageData.split(":");
            if(messageArr[0] !=="xx")
 			mqttclient.publish(messageArr[0], messageArr[1]);
        }
    });
    socket.on('close', function (err) {
            if (err) {
                console.log("socket error" + err + "[IP]");
            } else {
                console.log("socket closing" + err);
            }
    });
    socket.on('error', function (err) {
            if (err) {
                try {
                    console.log("socket error" + err);
                } catch (err) {
                    console.log("socket server error" + err)
                }
            }
    });
    socket.on('disconnect', function () {
       console.log(' disconnected socketid: ');
    });
    //连接结束
    socket.on('end', function(data) {
        //销毁变量
        if(mqttclient !== undefined)
        {
	         mqttclient.unsubscribe(SN,function(){
	              mqttclient.end(true); //true=>force close
	         });        	
	    }
    });
        //60秒没数据  就结束
    socket.setTimeout(60000,function(){
        var res={error:3,msg:"timeout"};
        var resStr=JSON.stringify(res);
        socket.write(resStr);
        socket.end();
    })
}).listen(3000);

tcpserver.on('listening', function() {
 console.log('Server is listening on port');
});