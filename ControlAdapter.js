var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("/dev/ttyO1", {
    baudrate: 115200
});
serialPort.on("open", function() {
    console.log("Open /dev/ttyO1");
});

serialPort.on('data', function(data) {
    console.log(data);
    console.log("Received: " + data);
});

exports.permitjoin = function permitjoin(info, DB, callback) {
    var messper = new Uint8Array(8);
    messper[0] = 0x44;
    messper[1] = 0x31;
    messper[2] = 0x32;
    messper[3] = 0x28;
    serialPort.write(messper);
    serialPort.on('data', function(data) {
        try {
            if (data[0] == 0x44 && data[1] == 0x33 && data[2] == 0x33) {
                DB.addDevice(new DB.Device(null, info.name, info.descrip, 0, 48, data[4]*256+data[5], data[6], info.parent), function (rs) {

                });
                DB.addDevice(new DB.Device(null, info.name, info.descrip, 0, 49, data[4]*256+data[5], data[6], info.parent), function (rs) {

                });
                DB.addDevice(new DB.Device(null, info.name, info.descrip, 0, 50, data[4]*256+data[5], data[6], info.parent), function (rs) {

                });
                callback(true);
            }
        } catch (err) {
            console.log(err);
        }
    });
    setTimeout(function() {
        try {
            callback(false);
        } catch (err) {
            console.log(err);
        }
    }, 40000);
}

exports.switchstt = function switchstt(input, DB, callback) {
    var devCtrl = new Uint8Array(8);
    devCtrl[0]=0x44;
    devCtrl[1]=0x31;
    devCtrl[2]=0x34;
    DB.getDevice(input.arg, function (data) {
        if (data.success) {
            devCtrl[3]=data.devices[0].idx;
            devCtrl[4]=data.devices[0].netadd/256;
            devCtrl[5]=data.devices[0].netadd%256;
            devCtrl[6]=data.devices[0].endpoint;
            if (input.act == 'on') {
                devCtrl[7]=0x31;
            }
            else if (input.act == 'off') {
                devCtrl[7]=0x30;
            }
            if (input.act == 'on' || input.act == 'off') {
                serialPort.write(devCtrl, function(err, result) {
                    console.log(devCtrl);
                    console.log("error:" + err);
                    console.log("result:" + result);
                    if (result) callback({success: true, message: "Chuyển trạng thái thiết bị thành công"});
                });
            }
            else callback({success: false, message: "Sai cú pháp điều khiển"});
        }
        else {
            callback({success: false, message: "Không có thiết bị nào tương ứng."})
        }
    });

}