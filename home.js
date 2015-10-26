var DB = require('./DBAdapter.js');
var ControlAdapter = require('./ControlAdapter.js');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var jwt = require('jsonwebtoken');


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

apiRoutes.post('/auth', function(req, res) {
    DB.auth(req.body.user, req.body.password, jwt, function (result) {
        if (result.success == true) res.send(result);
        else res.status(403).send(result);
    });
});
apiRoutes.post('/changepass', function(req, res) {
    if (req.body.user && req.body.password && req.body.newpass && req.body.password.length >= 6 && req.body.newpass.length >= 6) {
        DB.changePass(req.body.user, req.body.password, req.body.newpass, function(result) {
            if (result.success == true) res.send(result);
            else res.status(403).send(result);
        });
    } else return res.status(403).send({
        success: false,
        message: 'Tên người dùng, mật khẩu cũ và mới không đúng định dạng. Mời nhập lại.'
    });
});
apiRoutes.post('/init', function(req, res) {
    DB.init(function(result) {
        res.send(result);
    });
});
/*
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
*/
apiRoutes.route("/device").post(function(req, res, next) {
    var dev = new DB.Device(req.body.id, req.body.name, req.body.descrip, req.body.type, req.body.idx, req.body.netadd, req.body.endpoint, req.body.parent);
    DB.addDevice(dev, function(rs) {
        res.send(rs);
});
}).get(function(req, res, next) {
    DB.getDevice(undefined, function(rs) {
        res.send(rs);
    })
}).put(function(req, res, next) {
    var dev = new DB.Device(req.body.id, req.body.name, req.body.descrip, req.body.type, req.body.idx, req.body.netadd, req.body.endpoint, req.body.parent);
    DB.updateDevice(dev, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/device/:arg").get(function(req, res, next) {
    DB.getDevice(req.params.arg, function(rs) {
        res.send(rs);
    })
}).delete(function(req, res, next) {
    DB.removeDevice(req.params.arg, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group").post(function(req, res, next) {
    var gr = new DB.Group(req.body.id, req.body.name, req.body.descrip, req.body.lft, req.body.rgt, req.body.subgroup, req.body.subdevice);
    gr.parent = req.body.parent;
    DB.addGroup(gr, function(rs) {
        res.send(rs);
    });
}).get(function(req, res, next) {
    DB.getGroup(undefined, true, true, function(rs) {
        res.send(rs);
    })
}).put(function(req, res, next) {
    var gr = new DB.Group(req.body.id, req.body.name, req.body.descrip, req.body.lft, req.body.rgt, req.body.subgroup, req.body.subdevice);
    DB.updateGroup(gr, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group/:arg").get(function(req, res, next) {
    DB.getGroup(req.params.arg, false, false, function(rs) {
        res.send(rs);
    })
}).delete(function(req, res, next) {
    DB.removeGroup(req.params.arg, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group/subgrp/:arg").get(function(req, res, next) {
    DB.getGroup(req.params.arg, true, false, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group/subdev/:arg").get(function(req, res, next) {
    DB.getGroup(req.params.arg, false, true, function(rs) {
        res.send(rs);
    })
})
apiRoutes.route("/group/suball/:arg").get(function(req, res, next) {
    DB.getGroup(req.params.arg, true, true, function(rs) {
        res.send(rs);
    })
})

apiRoutes.route("/permitjoin").post(function(req, res, next) {
    ControlAdapter.permitjoin(req.body, DB, function(result) {
        res.send({
            success: result,
            message: 'PermitJoin INFO'
        });
    });
})

apiRoutes.route("/device/:arg/:act").post(function(req, res, next) {
    ControlAdapter.command(req.params, DB, function (result) {
        res.send(result);
    });

})

app.use('/api', apiRoutes);
