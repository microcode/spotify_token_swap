var express = require("express"),
    app = express(),
    request = require("request"),
    crypto = require('crypto'),
    url = require('url'),
    bodyParser = require("body-parser");

var CLIENT_ID = "e6695c6d22214e0f832006889566df9c";
var CLIENT_SECRET = "29eb02041ba646179a1189dccac112c7";
var ENCRYPTION_SECRET = "cFJLyifeUJUBFWdHzVbykfDmPHtLKLGzViHW9aHGmyTLD8hGXC";
var CLIENT_CALLBACK_URL = "spotifyiossdkexample://";
var AUTH_HEADER = "Basic " + new Buffer(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64");
var SPOTIFY_ACCOUNTS_ENDPOINT = "https://accounts.spotify.com";

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/swap", function (req, res) {
    if (!req.body || !req.body.hasOwnProperty("auth_code")) {
        res.status(550).send("Permission Denied");
        return;
    }

    var form_data = {
        "grant_type": "authorization_code",
        "redirect_uri": CLIENT_CALLBACK_URL,
        "code": req.body.auth_code
    };

    request.post({
        "url": url.resolve(SPOTIFY_ACCOUNTS_ENDPOINT, "/api/token"),
        headers: {
            "Authorization": AUTH_HEADER,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        form: form_data
    }, function (err, response, body) {
        if (err) {
            res.status(500).send("Internal Server Error");
            return;
        }

        if (response.statusCode != 200) {
            res.status(550).send("Permission Denied");
            return;
        }

        var token_data = JSON.parse(body);

        var cipher = crypto.createCipher("DES-EDE3-CBC", ENCRYPTION_SECRET);
        var encrypted_token = Buffer.concat([cipher.update(token_data.refresh_token), cipher.final()]).toString("base64");

        res.send({
            "refresh_token": encrypted_token
        }, {
            "Content-Type": "application/json"
        }, 200);
    });
});

app.post("/refresh", function (req, res) {
    if (!req.body || !req.body.hasOwnProperty("refresh_token")) {
        res.status(550).send("Permission Denied");
        return;
    }

    var encrypted_token = new Buffer(req.body.refresh_token, 'base64');

    var decipher = crypto.createDecipher("DES-EDE3-CBC", ENCRYPTION_SECRET);
    var refresh_token = Buffer.concat([decipher.update(encrypted_token), decipher.final()]).toString();

    var form_data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    };

    request.post({
        url: url.resolve(SPOTIFY_ACCOUNTS_ENDPOINT, "/api/token"),
        headers: {
            "Authorization": AUTH_HEADER,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        form: form_data
    }, function (err, response, body) {
        if (err) {
            res.status(500).send("Internal Server Error");
            return;
        }

        if (response.statusCode != 200) {
            res.status(550).send("Permission Denied");
            return;
        }

        res.status(response.statusCode).set({
            "Content-Type": "application/json"
        }).send(body);
    });
});

var server = app.listen(1234, function () {
    console.log("Token swap service listening on http://%s:%d", server.address().address, server.address().port);
});
