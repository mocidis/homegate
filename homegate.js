var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('mydb.db');
db.run("PRAGMA foreign_keys=ON");
exports.init = function init(callback) {
	try {
		db.serialize(function() {
			db.run("DROP TABLE IF EXISTS `device`;");
			db.run("DROP TABLE IF EXISTS `group`;");
			db.run("CREATE TABLE IF NOT EXISTS `group` (\
				`id`	INTEGER PRIMARY KEY AUTOINCREMENT,\
				`name`	TEXT,\
				`descrip`	TEXT,\
				`lft`	INTEGER NOT NULL,\
				`rgt`	INTEGER NOT NULL\
				)\
			");
			db.run("CREATE TABLE IF NOT EXISTS `device` (\
				`id`	INTEGER PRIMARY KEY AUTOINCREMENT,\
				`name`	TEXT,\
				`descrip`	TEXT,\
				`type`	INTEGER NOT NULL,\
				`endpoint`	TEXT NOT NULL,\
				`parent`	INTEGER NOT NULL,\
				FOREIGN KEY(parent) REFERENCES `group`(id) ON DELETE CASCADE\
				)\
			");
			db.run("INSERT INTO `group`(id,name,lft,rgt) VALUES(1,'ELECTRONICS',1,20),(2,'TELEVISIONS',2,9),(3,'TUBE',3,4),(4,'LCD',5,6),(5,'PLASMA',7,8),(6,'PORTABLE ELECTRONICS',10,19),(7,'MP3 PLAYERS',11,14),(8,'FLASH',12,13),(9,'CD PLAYERS',15,16),(10,'2 WAY RADIOS',17,18);");
			db.run("INSERT INTO `device`(name, type, endpoint, parent) VALUES('20\" TV',1,'192.168.1.9',3),('36\" TV',1,'192.168.1.9',3),('Super-LCD 42\"',1,'192.168.1.9',4),('Ultra-Plasma 62\"',1,'192.168.1.9',5),('Value Plasma 38\"',1,'192.168.1.9',5),('Power-MP3 5gb',1,'192.168.1.9',7),('Super-Player 1gb',1,'192.168.1.9',8),('Porta CD',1,'192.168.1.9',9),('CD To go!',1,'192.168.1.9',9),('Family Talk 360',1,'192.168.1.9',10);");
		});
	}
	catch (ex) {
		return callback(ex);
	}
	return callback(JSON.parse('{"message" : \"Da thiet lap lai co so du lieu\"}'));
}

function getRoot (argument) {
	// body...
}

exports.addGroup = function addGroup(data, callback) {
	if (data.parent == undefined || data.parent == null) {
		db.get("SELECT count(id) as total FROM `group`", function (err, row) {
			if (row != undefined && row.total == 0) {
				db.serialize(function () {
					db.run("BEGIN");
					db.run("INSERT INTO `group` (name, descrip, lft, rgt) VALUES('"+data.name+"','"+data.descrip+"',1,2)");
					db.run("COMMIT");
					db.get("SELECT * from `group` WHERE lft = 1", function (err2, row2) {
						return callback(JSON.parse(JSON.stringify(row2)));
					});
				});
			}
			else
				return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
		});
	} else {
		db.get("SELECT * FROM `group` WHERE id="+parseInt(data.parent), function (err, row) {
			if (row == undefined || row == null) {
				return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
			} else {
				db.serialize(function () {
					db.run("BEGIN");
					db.run("UPDATE `group` SET rgt = rgt + 2 WHERE rgt >= "+row.rgt);
					db.run("UPDATE `group` SET lft = lft + 2 WHERE lft >= "+row.rgt);
					db.run("INSERT INTO `group` (name, descrip, lft, rgt) VALUES('"+data.name+"','"+data.descrip+"',"+row.rgt+","+(row.rgt+1)+")");
					db.run("COMMIT");
					db.get("SELECT * FROM `group` WHERE lft = "+row.rgt, function (err2, row2) {
						return callback(JSON.parse(JSON.stringify(row2)));
					});
				})
			}
		});
	}
}

exports.removeGroup = function removeGroup(arg, callback) {
	if (arg == undefined || arg == null) {
		return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
	} else {
		var query = "";
		if (typeof arg == 'string') {
			query = "SELECT * FROM `group` WHERE name = '"+arg+"'";
		} else if (typeof arg == 'number') {
			query = "SELECT * FROM `group` WHERE id = "+arg;
		}
		db.get(query, function (err, row) {
			if (row == undefined) {
				return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
			} else {
				var width = row.rgt - row.lft + 1;
				db.serialize(function () {
					db.run("BEGIN");
					db.run("DELETE FROM `group` where lft BETWEEN "+row.lft+" AND "+row.rgt);
					db.run("UPDATE `group` SET rgt = rgt - "+width+" WHERE rgt > "+row.rgt);
					db.run("UPDATE `group` SET lft = lft - "+width+" WHERE lft > "+row.rgt);
					db.run("COMMIT");
				})
				return callback(JSON.parse('{"message" : \"Da xoa thanh cong group '+row.name+' va cac group, device truc thuoc\"}'));
			}
		});
	}
}
// setTimeout(addGroup,3000,1, {"name": "GAME CONSOLES moi", "descrip": null});
// setTimeout(removeGroup, 6000, 4);
// removeGroup(11);


exports.addDevice = function addDevice(data, callback) {
	if (data.parent == undefined || data.parent == null) {
		return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
	} else {
		db.get("SELECT * FROM `group` WHERE id="+data.parent, function (err, row) {
			if (row == undefined) {
				return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
			} else {
				db.get("SELECT * FROM `device` WHERE name = '"+data.name+"' AND endpoint = '"+data.endpoint+"' AND parent = "+data.parent, function (err, row) {
					if (row != undefined) {
						return callback(JSON.parse('{"message" : \"Device da co san trong group, khong them lai\"}'));
					}
					else {
						db.serialize(function () {
							db.run("BEGIN");
							db.run("INSERT INTO `device` (name, descrip, type, endpoint, parent) VALUES ('"+data.name+"', '"+data.descrip+"', "+data.type+", '"+data.endpoint+"', "+data.parent+")");
							db.run("COMMIT");
							db.get("SELECT * FROM `device` WHERE name = '"+data.name+"' AND endpoint = '"+data.endpoint+"' AND parent = "+data.parent, function (err2, row2) {
								return callback(JSON.parse(JSON.stringify(row2)));
							});
						});
					}
				});
			}
		});
	}
}

exports.removeDevice = function removeDevice(arg, callback) {
	if (arg == undefined || arg == null) {
		return callback(JSON.parse('{"message" : \"Khong co device nao tuong ung\"}'));
	} else {
		var query = "";
		if (typeof arg == 'string') {
			query = "SELECT * FROM `device` WHERE name = '"+arg+"'";
		} else if (typeof arg == 'number') {
			query = "SELECT * FROM `device` WHERE id = "+arg;
		}
		db.get(query, function (err, row) {
			if (row == undefined) {
				return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
			} else {
				db.serialize(function () {
					db.run("BEGIN");
					db.run("DELETE FROM `device` WHERE id = "+id);
					db.run("COMMIT");
				});
				return callback(JSON.parse('{"message" : \"Da xoa thanh cong device '+row.name+'\"}'));
			}
		});
	}
}

exports.getAllGroup = function getAllGroup (callback) {
	db.all("SELECT * FROM `group`", function (err, row) {
		return callback(JSON.parse(JSON.stringify(row)));
	});
}

exports.getAllDevice = function getAllDevice (callback) {
	db.all("SELECT * FROM `device`", function (err, row) {
		return callback(JSON.parse(JSON.stringify(row)));
	});
}

exports.getSubGroup = function getSubGroup (arg, callback) {
	if (arg == undefined || arg == null) {
		return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
	} else {
		var query = "";
		if (typeof arg == 'string') {
			query = "SELECT `node`.* FROM `group` as `node`, `group` as `parent` WHERE `node`.lft BETWEEN `parent`.lft AND `parent`.rgt AND `parent`.name = '"+arg+"'";
		} else if (typeof arg == 'number') {
			query = "SELECT `node`.* FROM `group` as `node`, `group` as `parent` WHERE `node`.lft BETWEEN `parent`.lft AND `parent`.rgt AND `parent`.id = "+arg;
		}
		db.all(query, function (err, row) {
			if (row == undefined) {
				return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
			} else {
				return callback(JSON.parse(JSON.stringify(row)));
			}
		});
	}
}

exports.getImSubGroup = function getImSubGroup (arg, callback) {
	if (arg == undefined || arg == null) {
		return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
	} else {
		var query = "";
		if (typeof arg == 'string') {
			query = "SELECT node.* FROM `group` AS node, `group` AS parent, `group` AS sub_parent, ( SELECT node.name, (COUNT(parent.name) - 1) AS depth FROM `group` AS node, `group` AS parent WHERE node.lft BETWEEN parent.lft AND parent.rgt AND node.name = '"+arg+"' GROUP BY node.name ORDER BY node.lft ) AS sub_tree WHERE node.lft BETWEEN parent.lft AND parent.rgt AND node.lft BETWEEN sub_parent.lft AND sub_parent.rgt AND sub_parent.name = sub_tree.name GROUP BY node.name HAVING (COUNT(parent.name) - (sub_tree.depth + 1)) <= 1 ORDER BY node.lft";
		} else if (typeof arg == 'number') {
			query = "SELECT node.* FROM `group` AS node, `group` AS parent, `group` AS sub_parent, ( SELECT node.name, (COUNT(parent.name) - 1) AS depth FROM `group` AS node, `group` AS parent WHERE node.lft BETWEEN parent.lft AND parent.rgt AND node.id = "+arg+" GROUP BY node.name ORDER BY node.lft ) AS sub_tree WHERE node.lft BETWEEN parent.lft AND parent.rgt AND node.lft BETWEEN sub_parent.lft AND sub_parent.rgt AND sub_parent.name = sub_tree.name GROUP BY node.name HAVING (COUNT(parent.name) - (sub_tree.depth + 1)) <= 1 ORDER BY node.lft";
		}
		db.all(query, function (err, row) {
			if (row == undefined) {
				return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
			} else {
				return callback(JSON.parse(JSON.stringify(row)));
			}
		});
	}
}

exports.getDeviceOf = function getDeviceOf (arg, callback) {
	getSubGroup(arg, function (row) {
		var grlist = row;
		var arr = "";
		for (var i = 0; i < grlist.length; i++) {
			if (i == grlist.length-1)
				arr += grlist[i].id;
			else
				arr += grlist[i].id+", ";
		};
		db.all("SELECT * FROM `device` WHERE parent IN ("+arr+")", function (err, row) {
			if (row == undefined || row.length == 0) {
				return callback(JSON.parse('{"message" : \"Khong co device nao thuoc group nay, hoac khong co group nay\"}'));
			} else {
				return callback(JSON.parse(JSON.stringify(row)));
			}
		});
	});
}

exports.getImDeviceOf = function getImDeviceOf (arg, callback) {
	if (arg == undefined || arg == null) {
		return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
	} else {
		var query = "";
		if (typeof arg == 'string') {
			query = "SELECT `device`.* FROM `device` JOIN `group` ON `device`.parent = `group`.id WHERE `group`.name = '"+arg+"'";
		} else if (typeof arg == 'number') {
			query = "SELECT * FROM `device` WHERE parent = "+arg;
		}
		db.all(query, function (err, row) {
			if (row == undefined) {
				return callback(JSON.parse('{"message" : \"Khong co device nao thuoc group nay, hoac khong co group nay\"}'));
			} else {
				return callback(JSON.parse(JSON.stringify(row)));
			}
		});
	}
}

exports.getGroupInfo = function getGroupInfo (arg, callback) {
	if (arg == undefined || arg == null) {
		return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
	} else {
		var query = "";
		if (typeof arg == 'string') {
			query = "SELECT * FROM `group` WHERE name = '"+arg+"'";
		} else if (typeof arg == 'number') {
			query = "SELECT * FROM `group` WHERE id = "+arg;
		}
		db.get(query, function (err, row) {
			if (row == undefined) {
				return callback(JSON.parse('{"message" : \"Khong co group nao tuong ung\"}'));
			} else {
				return callback(JSON.parse(JSON.stringify(row)));
			}
		});
	}
}

exports.getDeviceInfo = function getDeviceInfo (arg, callback) {
	if (arg == undefined || arg == null) {
		return callback(JSON.parse('{"message" : \"Khong co device nao tuong ung\"}'));
	} else {
		var query = "";
		if (typeof arg == 'string') {
			query = "SELECT * FROM `device` WHERE name = '"+arg+"'";
		} else if (typeof arg == 'number') {
			query = "SELECT * FROM `device` WHERE id = "+arg;
		}
		db.get(query, function (err, row) {
			if (row == undefined) {
				return callback(JSON.parse('{"message" : \"Khong co device nao tuong ung\"}'));
			} else {
				return callback(JSON.parse(JSON.stringify(row)));
			}
		});
	}
}