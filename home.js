var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('mydb.db');
db.run("PRAGMA foreign_keys=ON");
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyO1", {
    baudrate: 115200
});

serialPort.on("open", function () {
    console.log("Open /dev/ttyO1");
});

app.set('superSecret', 'dicomsmarthome');
app.use(bodyParser.json());
app.use(bodyParser.json({
    type: 'application/*+json'
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
var apiRoutes = express.Router();
var server = app.listen(8888, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Magic happens at http://%s:%s', host, port);
});

function isID(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    if (x < 1) return false;
    return (x | 0) === x;
}

function changePass(user, pass, newpass, callback) {
    console.log(user + pass + newpass);
    if (user != undefined && pass != undefined && pass.length >= 6 && newpass != undefined && newpass.length >= 6) {
        db.get("SELECT * FROM `user` WHERE user = '" + user + "'", function(err, row) {
            if (row === undefined) {
                callback({
                    success: false,
                    message: 'Không có user nào tương ứng.'
                });
            } else if (crypto.createHash('sha1').update(pass).digest("hex") != row.password) {
                callback({
                    success: false,
                    message: 'Mật khẩu cũ không đúng.'
                });
            } else {
                db.run("BEGIN");
                db.run("UPDATE `user` SET password = '" + crypto.createHash('sha1').update(newpass).digest("hex") + "' WHERE user = '" + user + "'");
                db.run("COMMIT");
                callback({
                    success: true,
                    message: 'Đã đổi mật khẩu thành công.'
                });
            }
        });
    } else callback({
        success: false,
        message: 'Tên người dùng hoặc mật khẩu không đúng định dạng.'
    });
}

function init(callback) {
    try {
        db.serialize(function() {
            db.run("DROP TABLE IF EXISTS `device`;");
            db.run("DROP TABLE IF EXISTS `group`;");
            db.run("DROP TABLE IF EXISTS `user`;");
            db.run("CREATE TABLE IF NOT EXISTS `group` (\
                    `id`  INTEGER PRIMARY KEY AUTOINCREMENT,\
                    `name`  TEXT,\
                    `descrip` TEXT,\
                    `lft` INTEGER NOT NULL,\
                    `rgt` INTEGER NOT NULL\
                    )\
            ");
            db.run("CREATE TABLE IF NOT EXISTS `device` (\
                    `id`  INTEGER PRIMARY KEY AUTOINCREMENT,\
                    `name`  TEXT,\
                    `descrip` TEXT,\
                    `type`  INTEGER NOT NULL,\
                    `endpoint`  TEXT NOT NULL,\
                    `parent`  INTEGER NOT NULL,\
                    FOREIGN KEY(parent) REFERENCES `group`(id) ON DELETE CASCADE\
                    )\
            ");
            db.run("CREATE TABLE IF NOT EXISTS `user` (`user` TEXT PRIMARY KEY NOT NULL, `password` TEXT NOT NULL)");
            db.run("INSERT INTO `group`(id,name,lft,rgt) VALUES(1,'ELECTRONICS',1,20),(2,'TELEVISIONS',2,9),(3,'TUBE',3,4),(4,'LCD',5,6),(5,'PLASMA',7,8),(6,'PORTABLE ELECTRONICS',10,19),(7,'MP3 PLAYERS',11,14),(8,'FLASH',12,13),(9,'CD PLAYERS',15,16),(10,'2 WAY RADIOS',17,18);");
            db.run("INSERT INTO `device`(name, type, endpoint, parent) VALUES('20\" TV',1,'192.168.1.9',3),('36\" TV',1,'192.168.1.9',3),('Super-LCD 42\"',1,'192.168.1.9',4),('Ultra-Plasma 62\"',1,'192.168.1.9',5),('Value Plasma 38\"',1,'192.168.1.9',5),('Power-MP3 5gb',1,'192.168.1.9',7),('Super-Player 1gb',1,'192.168.1.9',8),('Porta CD',1,'192.168.1.9',9),('CD To go!',1,'192.168.1.9',9),('Family Talk 360',1,'192.168.1.9',10);");
            db.run("INSERT INTO `user`(user, password) VALUES ('root', '" + crypto.createHash('sha1').update('123456').digest("hex") + "')");
        });
        callback({
            success: true,
            message: 'Đã thiết lập lại Database thành công.',
        });
    } catch (err) {
        callback({
            success: false,
            message: 'Thiết lập lại Database không thành công.'
        });
    }
}

function Device(id, name, descrip, type, endpoint, parent) {
    var id, name, descrip, type, endpoint, parent;
    (function() {
        this.id = id;
        this.name = name;
        this.descrip = descrip;
        this.type = type;
        this.endpoint = endpoint;
        this.parent = parent;
    }).call(this);
}

function Group(id, name, descrip, lft, rgt, subgroup, subdevice) {
    var id, name, descrip, lft, rgt, subgroup, subdevice;
    (function() {
        this.id = id;
        this.name = name;
        this.descrip = descrip;
        this.lft = lft;
        this.rgt = rgt;
        this.subgroup = subgroup == undefined ? [] : subgroup;
        this.subdevice = subdevice == undefined ? [] : subdevice;
    }).call(this);
};

function getDevice(arg, callback) {
    if (arg == undefined) {
        db.all("SELECT * FROM `device`", function(err, row) {
            if (row == undefined || row.length == 0) callback({
                success: false,
                message: 'Không có Device nào trong Database.'
            });
            else callback({
                success: true,
                devices: row
            });
        })
    } else {
        var query = "";
        if (!isID(arg)) {
            query = "SELECT * FROM `device` WHERE name LIKE '%" + arg + "%'";
        } else {
            query = "SELECT * FROM `device` WHERE id = " + arg;
        }
        db.all(query, function(err, row) {
            if (row == undefined || row.length == 0) {
                callback({
                    success: false,
                    message: 'Không có Device nào tương ứng.'
                });
            } else {
                callback({
                    success: true,
                    devices: row
                });
            }
        });
    }
}

function addDevice(arg, callback) {
    if (arg instanceof Device && arg.parent) {
        db.get("SELECT * FROM `group` WHERE id = " + arg.parent, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Group cha nào phù hợp.'
                });
            } else {
                db.get("SELECT * FROM `device` WHERE name = '" + arg.name + "' AND endpoint = '" + arg.endpoint + "' AND parent = " + arg.parent, function(err, row) {
                    if (row != undefined) {
                        callback({
                            success: false,
                            message: 'Device bị trùng, đã có sẵn trong Group cha.'
                        });
                    } else {
                        db.serialize(function() {
                            db.run("BEGIN");
                            db.run("INSERT INTO `device` (name, descrip, type, endpoint, parent) VALUES ('" + arg.name + "', '" + arg.descrip + "', " + arg.type + ", '" + arg.endpoint + "', " + arg.parent + ")");
                            db.run("COMMIT");
                            db.get("SELECT * FROM `device` WHERE name = '" + arg.name + "' AND endpoint = '" + arg.endpoint + "' AND parent = " + arg.parent, function(err2, row2) {
                                callback({
                                    success: true,
                                    device: row2
                                });
                            });
                        });
                    }
                });
            }
        });
    } else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

function removeDevice(arg, callback) {
    if (arg) {
        var query = "";
        if (!isID(arg)) {
            query = "SELECT * FROM `device` WHERE name = '" + arg + "'";
        } else {
            query = "SELECT * FROM `device` WHERE id = " + arg;
        }
        db.get(query, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Device nào tương ứng.'
                });
            } else {
                db.serialize(function() {
                    db.run("BEGIN");
                    db.run("DELETE FROM `device` WHERE id = " + row.id);
                    db.run("COMMIT");
                });
                callback({
                    success: true,
                    device: row
                });
            }
        });
    } else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

function updateDevice(arg, callback) {
    if (arg instanceof Device && arg.id) {
        db.get("SELECT * FROM `device` WHERE id = " + arg.id, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Device nào tương ứng.'
                });
            } else {
                db.serialize(function() {
                    db.run("BEGIN");
                    db.run("UPDATE `device` SET name = '" + arg.name + "', descrip = '" + arg.descrip + "', type = " + arg.type + ", endpoint = '" + arg.endpoint + "', parent = " + arg.parent + " WHERE id = " + arg.id);
                    db.run("COMMIT");
                });
                callback({
                    success: true,
                    device: arg
                });
            }
        });
    } else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

function createTree(arr, index, left, right) {
    if (arr === undefined || arr.length === 0) return (undefined);
    if (index === undefined && left === undefined && right === undefined) {
        index = 0;
        left = arr[0].lft;
        right = arr[0].rgt;
    }
    var root = new Group(arr[index].id, arr[index].name, arr[index].descrip, arr[index].lft, arr[index].rgt, arr[index].subgroup, arr[index].subdevice);
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].lft == left + 1 && arr[i].rgt < right) {
            root.subgroup.push(createTree(arr, i, arr[i].lft, arr[i].rgt));
            left = arr[i].rgt;
        }
    }
    return root;
}

function fetchDevGr(arg, callback) {
    if (arg instanceof Group) {
        var setId = "";

        function preOrder(node) {
            setId += node.id.toString() + ",";
            for (var i = 0; i < node.subgroup.length; i++) {
                preOrder(node.subgroup[i]);
            }
        }

        function setDev(node, arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].parent == node.id) node.subdevice.push(new Device(arr[i].id, arr[i].name, arr[i].descrip, arr[i].type, arr[i].endpoint, arr[i].parent));
            }
            for (var i = 0; i < node.subgroup.length; i++) {
                setDev(node.subgroup[i], arr);
            }
        }
        preOrder(arg);
        setId = setId.substring(0, setId.length - 1);
        db.all("SELECT * FROM `device` WHERE parent IN (" + setId + ")", function(err, row) {
            if (row != undefined || row.length > 0) {
                setDev(arg, row);
            }
            if (typeof callback == 'function') callback(arg);
        });
    }
}

function getGroup(arg, haveSubGrp, haveSubDev, callback) {
    var query = "";
    if (arg === undefined) query = "SELECT * FROM `group` ORDER BY lft";
    else if (!isID(arg)) {
        query = "SELECT `node`.* FROM `group` as `node`, `group` as `parent` WHERE `node`.lft BETWEEN `parent`.lft AND `parent`.rgt AND `parent`.name = '" + arg + "' ORDER BY node.lft";
    } else {
        query = "SELECT `node`.* FROM `group` as `node`, `group` as `parent` WHERE `node`.lft BETWEEN `parent`.lft AND `parent`.rgt AND `parent`.id = " + arg + " ORDER BY node.lft";
    }
    db.all(query, function(err, row) {
        if (row == undefined || row.length == 0) {
            if (arg === undefined) callback({
                success: false,
                message: 'Không có Group nào trong Database.'
            });
            else callback({
                success: false,
                message: 'Không có Group nào tương ứng.'
            });
        } else {
            var tree;
            if (haveSubGrp) {
                tree = createTree(row);
            } else tree = new Group(row[0].id, row[0].name, row[0].descrip, row[0].lft, row[0].rgt);
            if (haveSubDev) {
                fetchDevGr(tree, function(res) {
                    callback({
                        success: true,
                        group: res
                    });
                });
            } else callback({
                success: true,
                group: tree
            });
        }
    });
}

function addGroup(arg, callback) {
    if (arg instanceof Group && arg.parent) {
        db.get("SELECT count(id) as total FROM `group`", function(err, row) {
            if (row.total == 0) {
                db.serialize(function() {
                    db.run("BEGIN");
                    db.run("INSERT INTO `group` (name, descrip, lft, rgt) VALUES('" + arg.name + "','" + arg.descrip + "',1,2)");
                    db.run("COMMIT");
                    db.get("SELECT * from `group` WHERE lft = 1", function(err2, row2) {
                        callback({
                            success: true,
                            group: new Group(row2.id, row2.name, row2.descrip, row2.lft, row2.rgt)
                        });
                    });
                });
            } else {
                db.get("SELECT * FROM `group` WHERE id = " + arg.parent, function(err, row) {
                    if (row == undefined) {
                        callback({
                            success: false,
                            message: 'Không có Group cha nào tương ứng.'
                        });
                    } else {
                        db.serialize(function() {
                            db.run("BEGIN");
                            db.run("UPDATE `group` SET rgt = rgt + 2 WHERE rgt >= " + row.rgt);
                            db.run("UPDATE `group` SET lft = lft + 2 WHERE lft >= " + row.rgt);
                            db.run("INSERT INTO `group` (name, descrip, lft, rgt) VALUES('" + arg.name + "','" + arg.descrip + "'," + row.rgt + "," + (row.rgt + 1) + ")");
                            db.run("COMMIT");
                            db.get("SELECT * FROM `group` WHERE lft = " + row.rgt, function(err2, row2) {
                                callback({
                                    success: true,
                                    group: new Group(row2.id, row2.name, row2.descrip, row2.lft, row2.rgt)
                                });
                            });
                        })
                    }
                });
            }
        });
    } else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

function removeGroup(arg, callback) {
    if (arg) {
        var query = "";
        if (!isID(arg)) {
            query = "SELECT * FROM `group` WHERE name = '" + arg + "'";
        } else {
            query = "SELECT * FROM `group` WHERE id = " + arg;
        }
        db.get(query, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Group nào tương ứng.'
                });
            } else {
                var width = row.rgt - row.lft + 1;
                db.serialize(function() {
                    db.run("BEGIN");
                    db.run("DELETE FROM `group` where lft BETWEEN " + row.lft + " AND " + row.rgt);
                    db.run("UPDATE `group` SET rgt = rgt - " + width + " WHERE rgt > " + row.rgt);
                    db.run("UPDATE `group` SET lft = lft - " + width + " WHERE lft > " + row.rgt);
                    db.run("COMMIT");
                })
                callback({
                    success: true,
                    group: new Group(row.id, row.name, row.descrip, row.lft, row.rgt)
                });
            }
        });
    } else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

function updateGroup(arg, callback) {
    if (arg instanceof Group && arg.id) {
        db.get("SELECT * FROM `group` WHERE id = " + arg.id, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Group nào tương ứng.'
                });
            } else {
                db.serialize(function() {
                    db.run("BEGIN");
                    db.run("UPDATE `group` SET name = '" + arg.name + "', descrip = '" + arg.descrip + "' WHERE id = " + arg.id);
                    db.run("COMMIT");
                });
                callback({
                    success: true,
                    group: new Group(arg.id, arg.name, arg.descrip, arg.lft, arg.rgt)
                });
            }
        });
    } else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}
apiRoutes.post('/auth', function(req, res) {
    if (req.body.user && req.body.password && req.body.password.length >= 6) {
        db.all("SELECT * FROM `user`", function(err, row) {
            if (row != undefined && row.length > 0) {
                var success = false;
                for (var i = 0; i < row.length; i++) {
                    if (req.body.user == row[i].user && crypto.createHash('sha1').update(req.body.password).digest("hex") == row[i].password) {
                        var token = jwt.sign(row[i].user, app.get('superSecret'), {
                            expiresInMinutes: 1440 // expires in 24 hours
                        });
                        res.json({
                            success: true,
                            token: token
                        });
                        success = true;
                        break;
                    }
                }
                if (!success) res.json({
                    success: false,
                    message: 'Authentication failed. Wrong user and password.'
                });
            } else res.json({
                success: false,
                message: 'Authentication failed. No user and password in DB.'
            });
        });
    } else return res.status(403).send({
        success: false,
        message: 'No user and password provided.'
    });
});
apiRoutes.post('/changepass', function(req, res) {
    if (req.body.user && req.body.password && req.body.newpass && req.body.password.length >= 6 && req.body.newpass.length >= 6) {
        changePass(req.body.user, req.body.password, req.body.newpass, function(result) {
            if (result.success == true) res.send(result);
            else res.status(403).send(result);
        });
    } else return res.status(403).send({
        success: false,
        message: 'Tên người dùng, mật khẩu cũ và mới không đúng định dạng. Mời nhập lại.'
    });
});
apiRoutes.post('/init', function(req, res) {
    init(function(result) {
        res.send(result);
    });
});
apiRoutes.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.query.token || req.body.token || req.param.token || req.headers['x-access-token'];
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});
apiRoutes.route("/device").post(function(req, res, next) {
    var dev = new Device(req.body.id, req.body.name, req.body.descrip, req.body.type, req.body.endpoint, req.body.parent);
    addDevice(dev, function(rs) {
        res.send(rs);
    });
}).get(function(req, res, next) {
    getDevice(undefined, function(rs) {
        res.send(rs);
    })
}).put(function(req, res, next) {
    var dev = new Device(req.body.id, req.body.name, req.body.descrip, req.body.type, req.body.endpoint, req.body.parent);
    updateDevice(dev, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/device/:arg").get(function(req, res, next) {
    getDevice(req.params.arg, function(rs) {
        res.send(rs);
    })
}).delete(function(req, res, next) {
    removeDevice(req.params.arg, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group").post(function(req, res, next) {
    var gr = new Group(req.body.id, req.body.name, req.body.descrip, req.body.lft, req.body.rgt, req.body.subgroup, req.body.subdevice);
    gr.parent = req.body.parent;
    addGroup(gr, function(rs) {
        res.send(rs);
    });
}).get(function(req, res, next) {
    getGroup(undefined, true, true, function(rs) {
        res.send(rs);
    })
}).put(function(req, res, next) {
    var gr = new Group(req.body.id, req.body.name, req.body.descrip, req.body.lft, req.body.rgt, req.body.subgroup, req.body.subdevice);
    updateGroup(gr, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group/:arg").get(function(req, res, next) {
    getGroup(req.params.arg, false, false, function(rs) {
        res.send(rs);
    })
}).delete(function(req, res, next) {
    removeGroup(req.params.arg, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group/subgrp/:arg").get(function(req, res, next) {
    getGroup(req.params.arg, true, false, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group/subdev/:arg").get(function(req, res, next) {
    getGroup(req.params.arg, false, true, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group/suball/:arg").get(function(req, res, next) {
        getGroup(req.params.arg, true, true, function(rs) {
            res.send(rs);
        })
    })
    /* Code điều khiển thiết bị*/
function permitjoin(callback) {
    var mess = new Uint8Array(8);
    mess[0] = 0x44;
    mess[1] = 0x31;
    mess[2] = 0x32;
    mess[3] = 0x28;
    serialPort.write(mess);
    serialPort.on('data', function(data) {
        console.log(data);
        console.log("Received: " + data);
        if (data[0] == 0x44 && data[1] == 0x33 && data[2] == 0x33) callback(true);
    });
    setTimeout(function() {
        callback(false);
    }, 40000);
}
apiRoutes.route("/permitjoin").post(function(req, res, next) {
    try {
        permitjoin(function(result) {
            res.send({
                success: result,
                message: 'PermitJoin INFO'
            })
        });
    } catch (err) {
        console.log(err);
    }
})
app.use('/api', apiRoutes);