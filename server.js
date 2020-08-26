var express = require('express'),
    request = require('request'),
    bodyParser = require('body-parser'),
    app = express();
var multer  = require('multer')
var upload = multer()

var myLimit = typeof(process.argv[2]) != 'undefined' ? process.argv[2] : '100kb';
console.log('Using limit: ', myLimit);

app.use(bodyParser.json({limit: myLimit}));
app.use(bodyParser.urlencoded({ extended:true }))

//var urlencodedParser = bodyParser.urlencoded({extended: false});

app.all('*', upload.any(), function (req, res, next) {

    // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));

    if (req.method === 'OPTIONS') {
        // CORS Preflight
        res.send();
    } else {

        console.log(req)
        var targetURL = req.header('Target-URL');
        if (!targetURL) {
            res.send(500, { error: 'There is no Target-Endpoint header in the request' });
            return;
        }
        request({ url: targetURL, method: req.method, json: req.body, headers: {'Authorization': req.header('Authorization')}},
            function (error, response, body) {
                if (error) {
                    console.error('error: ' + error)
                }
            }).pipe(res);
    }
});

app.set('port', process.env.PORT || 3001);

app.listen(app.get('port'), function () {
    console.log('Proxy server listening on port ' + app.get('port'));
});