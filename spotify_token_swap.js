var express = require("express"),
    app = express(),
    request = require("request"),
    crypto = require('crypto'),
    url = require('url'),
    config = require('config'),
    debug = require('debug')('spotiy-token-swap'),
    bodyParser = require("body-parser");

var AUTH_HEADER = "Basic " + new Buffer(config.client_id + ":" + config.client_secret).toString("base64");

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/swap", function (req, res) {
    if (!req.body || !req.body.hasOwnProperty("code")) {
        debug("swap: missing auth code");
        res.status(550).send("Permission Denied");
        return;
    }

    var form_data = {
        "grant_type": "authorization_code",
        "redirect_uri": config.callback_url,
        "code": req.body.code
    };

    debug("swap: POSTing request to %s:", url.resolve(config.endpoint, "/api/token"), form_data);

    request.post({
        "url": url.resolve(config.endpoint, "/api/token"),
        headers: {
            "Authorization": AUTH_HEADER,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        form: form_data
    }, function (err, response, body) {
        if (err) {
            debug("swap: error: %s", err);
            res.status(500).send("Internal Server Error");
            return;
        }

        if (response.statusCode != 200) {
            debug("swap: response: %s", response.statusCode);
            res.status(550).send("Permission Denied");
            return;
        }

        var token_data = JSON.parse(body);

	debug("swap: token_data:", token_data);

        res.status(200).set({
            "Content-Type": "application/json"
        }).send(token_data);
    });
});

app.post("/refresh", function (req, res) {
    if (!req.body || !req.body.hasOwnProperty("refresh_token")) {
        res.status(550).send("Permission Denied");
        return;
    }

    var encrypted_token = new Buffer(req.body.refresh_token, 'base64');

    var refresh_token = req.body.refresh_token;

    debug("refresh: refresh_token: %s", refresh_token);

    var form_data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    };

    debug("refresh: POSTing request to %s:", url.resolve(config.endpoint, "/api/token"), form_data);

    request.post({
        url: url.resolve(config.endpoint, "/api/token"),
        headers: {
            "Authorization": AUTH_HEADER,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        form: form_data
    }, function (err, response, body) {
        if (err) {
            debug("refresh: error: %s", err);
            res.status(500).send("Internal Server Error");
            return;
        }

        if (response.statusCode != 200) {
            debug("refresh: response: %s", response.statusCode);
            res.status(550).send("Permission Denied");
            return;
        }

        debug("refresh: body: %s", body);

        res.status(response.statusCode).set({
            "Content-Type": "application/json"
        }).send(body);
    });
});

app.post("/api/token", function (req, res) {
    debug("token request:", req.body);

    res.status(200).set({
        "Content-Type": "application/json"
    });

    switch (req.body.grant_type) {
        case "authorization_code": {
            res.status(200).set({
                "Content-Type": "application/json"
            }).send({
                "refresh_token": "REFRESH TOKEN"
            });
        } break;
        case "refresh_token": {
            res.status(200).set({
                "Content-Type": "application/json"
            }).send({
                "access_token": "ACCESS TOKEN"
            });
        } break;
        default: {
            res.status(550).set({
                "Content-Type": "text/html"
            }).send("<html><body><h1>Access Denied</h1></body></html>");
        } break;
    }
});

var server = app.listen(1234, function () {
    debug("Token swap service listening on http://%s:%d", server.address().address, server.address().port);
});
