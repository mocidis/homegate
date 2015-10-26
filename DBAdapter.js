var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('mydb.db');
db.run("PRAGMA foreign_keys=ON");
var crypto = require('crypto');

exports.auth = function auth(user, password, jwt, callback) {
    if (user && password && password.length >= 6) {
        db.all("SELECT * FROM `user`", function(err, row) {
            if (row != undefined && row.length > 0) {
                var success = false;
                for (var i = 0; i < row.length; i++) {
                    if (user == row[i].user && crypto.createHash('sha1').update(password).digest("hex") == row[i].password) {
                        var token = jwt.sign(row[i].user, app.get('superSecret'), {
                            expiresInMinutes: 1440 // expires in 24 hours
                        });
                        callback({
                            success: true,
                            token: token
                        });
                        success = true;
                        break;
                    }
                }
                if (!success) callback({
                    success: false,
                    message: 'Đăng nhập không thành công. Sai tên đăng nhập hoặc mật khẩu.'
                });
            }
            else callback({
                success: false,
                message: 'Đăng nhập không thành công. Không có người dùng nào tương ứng.'
            });
        });
    }
    else return callback({
        success: false,
        message: 'No user and password provided.'
    });
}

exports.changePass = function changePass(user, pass, newpass, callback) {
    console.log(user + pass + newpass);
    if (user != undefined && pass != undefined && pass.length >= 6 && newpass != undefined && newpass.length >= 6) {
        db.get("SELECT * FROM `user` WHERE user = '" + user + "'", function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có user nào tương ứng.'
                });
            }
            else if (crypto.createHash('sha1').update(pass).digest("hex") != row.password) {
                callback({
                    success: false,
                    message: 'Mật khẩu cũ không đúng.'
                });
            }
            else {
                db.run("UPDATE `user` SET password = '" + crypto.createHash('sha1').update(newpass).digest("hex") + "' WHERE user = '" + user + "'", function(err2) {
                    if (err2 == undefined) {
                        callback({
                            success: true,
                            message: 'Đã đổi mật khẩu thành công.'
                        });
                    }
                    else {
                        callback({
                            success: false,
                            message: 'Đổi mật khẩu không thành công - Lỗi DB không cập nhật được'
                        })
                    }
                });
            }
        });
    }
    else callback({
        success: false,
        message: 'Tên người dùng hoặc mật khẩu không đúng định dạng.'
    });
}

exports.init = function init(callback) {
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
                    `idx` INTEGER NOT NULL,\
                    `netadd` INTEGER NOT NULL,\
                    `endpoint` INTEGER NOT NULL,\
                    `parent`  INTEGER NOT NULL,\
                    FOREIGN KEY(parent) REFERENCES `group`(id) ON DELETE CASCADE\
                    )\
            ");
            db.run("CREATE TABLE IF NOT EXISTS `user` (`user` TEXT PRIMARY KEY NOT NULL, `password` TEXT NOT NULL)");
            db.run("INSERT INTO `group`(id,name,lft,rgt) VALUES(1,'ELECTRONICS',1,20),(2,'TELEVISIONS',2,9),(3,'TUBE',3,4),(4,'LCD',5,6),(5,'PLASMA',7,8),(6,'PORTABLE ELECTRONICS',10,19),(7,'MP3 PLAYERS',11,14),(8,'FLASH',12,13),(9,'CD PLAYERS',15,16),(10,'2 WAY RADIOS',17,18);");
            //db.run("INSERT INTO `device`(name, type, endpoint, parent) VALUES('20\" TV',1,'192.168.1.9',3),('36\" TV',1,'192.168.1.9',3),('Super-LCD 42\"',1,'192.168.1.9',4),('Ultra-Plasma 62\"',1,'192.168.1.9',5),('Value Plasma 38\"',1,'192.168.1.9',5),('Power-MP3 5gb',1,'192.168.1.9',7),('Super-Player 1gb',1,'192.168.1.9',8),('Porta CD',1,'192.168.1.9',9),('CD To go!',1,'192.168.1.9',9),('Family Talk 360',1,'192.168.1.9',10);");
            db.run("INSERT INTO `user`(user, password) VALUES ('root', '" + crypto.createHash('sha1').update('123456').digest("hex") + "')");
        });
        callback({
            success: true,
            message: 'Đã thiết lập lại Database thành công.',
        });
    }
    catch (err) {
        callback({
            success: false,
            message: 'Thiết lập lại Database không thành công.'
        });
    }
}

function isID(value) {
    var x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    if (x < 1) return false;
    return (x | 0) === x;
}

var Device = exports.Device = function Device(id, name, descrip, type, idx, netadd, endpoint, parent) {
    var id, name, descrip, type, idx, netadd, endpoint, parent;
    (function() {
        this.id = id;
        this.name = name;
        this.descrip = descrip;
        this.type = type;
        this.idx = idx;
        this.netadd = netadd;
        this.endpoint = endpoint;
        this.parent = parent;
    }).call(this);
}

var Group = exports.Group = function Group(id, name, descrip, lft, rgt, subgroup, subdevice) {
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

exports.getDevice = function getDevice(arg, callback) {
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
    }
    else {
        var query = "";
        if (!isID(arg)) {
            query = "SELECT * FROM `device` WHERE name LIKE '%" + arg + "%'";
        }
        else {
            query = "SELECT * FROM `device` WHERE id = " + arg;
        }
        db.all(query, function(err, row) {
            if (row == undefined || row.length == 0) {
                callback({
                    success: false,
                    message: 'Không có Device nào tương ứng.'
                });
            }
            else {
                callback({
                    success: true,
                    devices: row
                });
            }
        });
    }
}

exports.addDevice = function addDevice(arg, callback) {
    if (arg instanceof Device && arg.parent) {
        db.get("SELECT * FROM `group` WHERE id = " + arg.parent, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Group cha nào phù h?p.'
                });
            }
            else {
                db.get("SELECT * FROM `device` WHERE idx = " + arg.idx + " AND netadd = " + arg.netadd + " AND endpoint = " + arg.endpoint + " AND parent = " + arg.parent, function(err, row) {
                    if (row != undefined) {
                        callback({
                            success: false,
                            message: 'Device bị trùng, đã có sẵn trong Group cha.'
                        });
                    }
                    else {
                        db.run("INSERT INTO `device` (name, descrip, type, idx, netadd, endpoint, parent) VALUES ('" + arg.name + "', '" + arg.descrip + "', " + arg.type + ", " + arg.idx + ", " + arg.netadd + ", " + arg.endpoint + ", " + arg.parent + ")", function(err2) {
                            if (err2 == undefined) {
                                db.get("SELECT * FROM `device` WHERE name = '" + arg.name + "' AND idx = " + arg.idx + " AND netadd = " + arg.netadd + " AND endpoint = " + arg.endpoint + " AND parent = " + arg.parent, function(err3, row3) {
                                    if (row3 != undefined) {
                                        callback({
                                            success: true,
                                            device: row3
                                        });
                                    }
                                    else {
                                        callback({
                                            success: false,
                                            message: 'Thêm Device không thành công - Lỗi DB'
                                        });
                                    }
                                });
                            }
                            else {
                                callback({
                                    success: false,
                                    message: 'Thêm Device không thành công - Lỗi DB'
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

exports.removeDevice = function removeDevice(arg, callback) {
    if (arg) {
        var query = "";
        if (!isID(arg)) {
            query = "SELECT * FROM `device` WHERE name = '" + arg + "'";
        }
        else {
            query = "SELECT * FROM `device` WHERE id = " + arg;
        }
        db.get(query, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Device nào tương ứng.'
                });
            }
            else {
                db.run("DELETE FROM `device` WHERE id = " + row.id, function(err2) {
                    if (err2 == undefined) {
                        callback({
                            success: true,
                            device: row
                        });
                    }
                    else {
                        callback({
                            success: false,
                            message: 'Xóa Device không thành công - Lỗi DB'
                        });
                    }
                });
            }
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

exports.updateDevice = function updateDevice(arg, callback) {
    if (arg instanceof Device && arg.id) {
        db.get("SELECT * FROM `device` WHERE id = " + arg.id, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Device nào tương ứng.'
                });
            }
            else {
                db.run("UPDATE `device` SET name = '" + arg.name + "', descrip = '" + arg.descrip + "', type = " + arg.type + ", idx = " + arg.idx + ", netadd = " + arg.netadd + ", endpoint = " + arg.endpoint + ", parent = " + arg.parent + " WHERE id = " + arg.id, function(err2) {
                    if (err2 == undefined) {
                        callback({
                            success: true,
                            device: arg
                        });
                    }
                    else {
                        callback({
                            success: false,
                            message: 'Cập nhật Device không thành công - Lỗi DB'
                        });
                    }
                });
            }
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

function createTree(arr, idx, left, right) {
    if (arr == undefined || arr.length == 0) return (undefined);
    if (idx == undefined && left == undefined && right == undefined) {
        idx = 0;
        left = arr[0].lft;
        right = arr[0].rgt;
    }
    var root = new Group(arr[idx].id, arr[idx].name, arr[idx].descrip, arr[idx].lft, arr[idx].rgt, arr[idx].subgroup, arr[idx].subdevice);
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

exports.getGroup = function getGroup(arg, haveSubGrp, haveSubDev, callback) {
    var query = "";
    if (arg == undefined) query = "SELECT * FROM `group` ORDER BY lft";
    else if (!isID(arg)) {
        query = "SELECT `node`.* FROM `group` as `node`, `group` as `parent` WHERE `node`.lft BETWEEN `parent`.lft AND `parent`.rgt AND `parent`.name = '" + arg + "' ORDER BY node.lft";
    }
    else {
        query = "SELECT `node`.* FROM `group` as `node`, `group` as `parent` WHERE `node`.lft BETWEEN `parent`.lft AND `parent`.rgt AND `parent`.id = " + arg + " ORDER BY node.lft";
    }
    db.all(query, function(err, row) {
        if (row == undefined || row.length == 0) {
            if (arg == undefined) callback({
                success: false,
                message: 'Không có Group nào trong Database.'
            });
            else callback({
                success: false,
                message: 'Không có Group nào tương ứng.'
            });
        }
        else {
            var tree;
            if (haveSubGrp) {
                tree = createTree(row);
            }
            else tree = new Group(row[0].id, row[0].name, row[0].descrip, row[0].lft, row[0].rgt);
            if (haveSubDev) {
                fetchDevGr(tree, function(res) {
                    callback({
                        success: true,
                        group: res
                    });
                });
            }
            else callback({
                success: true,
                group: tree
            });
        }
    });
}

exports.addGroup = function addGroup(arg, callback) {
    if (arg instanceof Group && arg.parent) {
        db.get("SELECT count(id) as total FROM `group`", function(err, row) {
            if (row.total == 0) {
                db.run("INSERT INTO `group` (name, descrip, lft, rgt) VALUES('" + arg.name + "','" + arg.descrip + "',1,2)", function(err2) {
                    if (err2 == undefined) {
                        db.get("SELECT * from `group` WHERE lft = 1", function(err3, row3) {
                            if (row3) {
                                callback({
                                    success: true,
                                    group: new Group(row3.id, row3.name, row3.descrip, row3.lft, row3.rgt)
                                });
                            }
                            else {
                                callback({
                                    success: false,
                                    message: 'Thêm Group không thành công - Lỗi DB'
                                });
                            }
                        });
                    }
                    else {
                        callback({
                            success: false,
                            message: 'Thêm Group không thành công - Lỗi DB'
                        });
                    }
                });
            }
            else {
                db.get("SELECT * FROM `group` WHERE id = " + arg.parent, function(err, row) {
                    if (row == undefined) {
                        callback({
                            success: false,
                            message: 'Không có Group cha nào tương ứng.'
                        });
                    }
                    else {
                        db.run("BEGIN" + ";UPDATE `group` SET rgt = rgt + 2 WHERE rgt >= " + row.rgt + ";UPDATE `group` SET lft = lft + 2 WHERE lft >= " + row.rgt + ";INSERT INTO `group` (name, descrip, lft, rgt) VALUES('" + arg.name + "','" + arg.descrip + "'," + row.rgt + "," + (row.rgt + 1) + ")" + ";COMMIT", function(err2) {
                            if (err2 == undefined) {
                                db.get("SELECT * FROM `group` WHERE lft = " + row.rgt, function(err3, row3) {
                                    if (row3) {
                                        callback({
                                            success: true,
                                            group: new Group(row3.id, row3.name, row3.descrip, row3.lft, row3.rgt)
                                        });
                                    }
                                    else {
                                        callback({
                                            success: false,
                                            message: 'Thêm Group không thành công - Lỗi DB'
                                        });
                                    }
                                });
                            }
                            else {
                                callback({
                                    success: false,
                                    message: 'Thêm Group không thành công - Lỗi DB'
                                });
                            }
                        })
                    }
                });
            }
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

exports.removeGroup = function removeGroup(arg, callback) {
    if (arg) {
        var query = "";
        if (!isID(arg)) {
            query = "SELECT * FROM `group` WHERE name = '" + arg + "'";
        }
        else {
            query = "SELECT * FROM `group` WHERE id = " + arg;
        }
        db.get(query, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Group nào tương ứng.'
                });
            }
            else {
                var width = row.rgt - row.lft + 1;
                db.run("BEGIN"+";DELETE FROM `group` where lft BETWEEN " + row.lft + " AND " + row.rgt+";UPDATE `group` SET rgt = rgt - " + width + " WHERE rgt > " + row.rgt+";UPDATE `group` SET lft = lft - " + width + " WHERE lft > " + row.rgt+";COMMIT", function(err2) {
                    if (err2 == undefined) {
                        callback({
                            success: true,
                            group: new Group(row.id, row.name, row.descrip, row.lft, row.rgt)
                        });
                    } else {
                        callback({
                            success: false,
                            message: 'Xóa Group không thành công - Lỗi DB'
                        });
                    }
                });
                
            }
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

exports.updateGroup = function updateGroup(arg, callback) {
    if (arg instanceof Group && arg.id) {
        db.get("SELECT * FROM `group` WHERE id = " + arg.id, function(err, row) {
            if (row == undefined) {
                callback({
                    success: false,
                    message: 'Không có Group nào tương ứng.'
                });
            }
            else {
                db.run("BEGIN"+";UPDATE `group` SET name = '" + arg.name + "', descrip = '" + arg.descrip + "' WHERE id = " + arg.id+";COMMIT", function(err2) {
                    if (err2 == undefined) {
                        callback({
                            success: true,
                            group: new Group(arg.id, arg.name, arg.descrip, arg.lft, arg.rgt)
                        });
                    } else {
                        callback({
                            success: false,
                            message: 'Cập nhật Group không thành công - Lỗi DB'
                        });
                    }
                })
                
            }
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}