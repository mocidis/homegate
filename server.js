var homegate = require('./homegate.js');
var express = require('express');
var app = express();
// getDevicesOf("CD PLAYERS", function (row) {
// 	console.log(row);
// });
function idOrName (arg) {
	return arg.id != undefined ? parseInt(arg.id) : arg.name != undefined ? arg.name : undefined;
}

app.get('/', function(req, res) {
    res.send('Hello World!');
});
var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});
app.route('/init').get(function(req, res) {
    try {
        homegate.init(function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/getAllGroup').get(function(req, res) {
    try {
        homegate.getAllGroup(function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/getAllDevice').get(function(req, res) {
    try {
        homegate.getAllDevice(function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/getSubGroup').get(function(req, res) {
    try {
        var arg = idOrName(req.query);
        homegate.getSubGroup(arg, function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/getImSubGroup').get(function(req, res) {
    try {
        var arg = idOrName(req.query);
        homegate.getImSubGroup(arg, function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/getGroupInfo').get(function(req, res) {
    try {
        var arg = idOrName(req.query);
        homegate.getGroupInfo(arg, function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/getDeviceInfo').get(function(req, res) {
    try {
        var arg = idOrName(req.query);
        console.log(typeof arg);
        homegate.getDeviceInfo(arg, function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/getDeviceOf').get(function(req, res) {
    try {
        var arg = idOrName(req.query);
        homegate.getDeviceOf(arg, function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/getImDeviceOf').get(function(req, res) {
    try {
        var arg = idOrName(req.query);
        homegate.getImDeviceOf(arg, function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/addGroup').get(function(req, res) {
    try {
        homegate.addGroup(JSON.parse(req.query.data), function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/removeGroup').get(function(req, res) {
    try {
        var arg = idOrName(req.query);
        homegate.removeGroup(arg, function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/addDevice').get(function(req, res) {
    try {
        homegate.addDevice(JSON.parse(req.query.data), function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});
app.route('/removeDevice').get(function(req, res) {
    try {
        var arg = idOrName(req.query);
        homegate.removeDevice(arg, function(json) {
            res.send(json);
        });
    } catch (ex) {
        res.send("Da co loi xay ra\n" + ex.stack);
    }
});