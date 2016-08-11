import commander from 'commander';
import http from 'http';
import series from 'async/series';
import {
    spawn
} from 'child_process';

commander
    .version('0.0.1')
    .option('-w, --working-dir <path>', 'Repo dir')
    .parse(process.argv);

const server = http.createServer((req, res) => {
    const headers = req.headers;
    const method = req.method;
    const url = req.url;
    let body = [];

    console.log('pulling...');
    series([
            callback => invoke('git', ['pull'], callback),
            callback => invoke('git', ['submodule', 'update'], callback),
            callback => invoke('git', ['submodule', 'foreach', 'git', 'checkout', 'master'], callback),
            callback => invoke('git', ['submodule', 'foreach', 'git', 'pull'], callback),
        ],
        (err, result) => {
            // Response
            res.statusCode = 200;
            if (err) {
                res.write(err);
                console.error(err);
            } else {
                res.write(result.join('\n'));
                console.log('done');
            }
            res.end();
        });
});
server.listen(80);

function invoke(cmd, args, callback) {
    const result = spawn(cmd, args, {
        cwd: commander.workingDir,
    });
    console.log(result.spawnargs.join(" "));

    let stdout = [];
    let stderr = [];
    result.stdout.on('data', data => {
        stdout.push(data);
        console.log(data.toString());
    });
    result.stderr.on('data', data => {
        stderr.push(data);
        console.error(data.toString());
    });
    result.on('exit', () => {
        callback(stderr.toString(), stdout.toString());
    });
}
