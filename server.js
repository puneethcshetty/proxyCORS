const express = require('express'),
    request = require('request'),
    bodyParser = require('body-parser'),
    app = express();
const multer  = require('multer')
const upload = multer()
const querystring = require('querystring');
const formurlencoded = require('form-urlencoded').default

var myLimit = typeof(process.argv[2]) != 'undefined' ? process.argv[2] : '100kb';
console.log('Using limit: ', myLimit);

app.use(bodyParser.json({limit: myLimit}));
app.use(bodyParser.urlencoded({ extended:true }))

function getTargetURL(req, spec) {
    let targetURL = null;

    //console.log(req.headers);
    if ( spec === undefined ) {
        targetURL = req.header('Target-URL');
    } else if ( spec === 'same-host' ) {
        let hostname = req.header('host');
        let j = hostname.indexOf(':');
        hostname = hostname.substring(0, j);
        //console.log('Host = ' + hostname);
        //targetURL = `http://${hostname}${req.path}`;
        targetURL = `http://localhost${req.path}`;
    }

    //console.log('Target URL = ' + targetURL);
    return targetURL;
}

app.all('*', upload.any(), (req, res, next) => {

    // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));

    if ( req.method === 'OPTIONS' ) {       // CORS Preflight
        res.send();
    } else {
        let targetURL = getTargetURL(req, undefined);
        
        if ( !targetURL ) {
            res.send(500, { error: 'Unable to set targetURL' });
            return;
        }

        let hasBody = ( req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' );
        let bodyData = null;

        let headers = {
            'Authorization': req.header('Authorization'),
            'Content-Type': "application/x-www-form-urlencoded"};
        
        if ( hasBody ) {
            bodyData = formurlencoded(req.body)
            headers['Content-Length'] = Buffer.byteLength(bodyData);
        }

        let options = {url: targetURL, method: req.method, headers: headers};
       
        let t = request(options, (error, response, body) => {
                if ( error ) {
                    console.error('error: ' + error)
                }
            });
        
        if ( hasBody ) {
            // console.log(req.headers)
            // console.log(res.getHeaders())
            // console.log(bodyData)
            t.write(bodyData);
        }

        t.pipe(res);
    }
});

app.set('port', process.env.PORT || 3001);
app.listen(app.get('port'), () => { 
    console.log('Proxy server listening on port ' + app.get('port'));
});