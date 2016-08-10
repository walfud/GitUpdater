import http from 'http';
import {
    spawn
} from 'child_process';

const server = http.createServer((req, res) => {
    const headers = req.headers;
    const method = req.method;
    const url = req.url;
    let body = [];

    req.on('error', (err) => {
        console.error(err);
    }).on('data', (data) => {
        body.push(data);
    }).on('end', () => {
        spawn('git', ['pull']).stdout.on('data', data => console.log(data.toString()));
    });

    // Response
    res.statusCode = 200;
    res.end();
});
server.listen(80);
