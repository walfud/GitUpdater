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

    console.log(`pulling...${commander.workingDir}`);
    series([
            callback => invoke('git', ['pull'], callback),
            callback => invoke('git', ['submodule', 'update'], callback),
            callback => invoke('git', ['submodule', 'foreach', 'git', 'checkout', 'master'], callback),
            callback => invoke('git', ['submodule', 'foreach', 'git', 'pull'], callback),
        ],
        (err, result) => {
            // Response
            if (err) {
                res.statusCode = 500;
                res.write(err);
                console.error(err);
            } else {
              res.statusCode = 200;
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
    const beginTip = `<<<${result.spawnargs.join(' ')}`;
    let out = [beginTip];
    result.stdout.on('data', data => {
        out.push(data);
        console.log(data.toString());
    });
    result.stderr.on('data', data => {
        out.push(data);
        console.error(data.toString());
    });
    result.on('exit', (code, signal) => {
        const endTip = `${result.spawnargs.join(' ')}:${code}>>>`;
        out.push(endTip);
        console.log(endTip);

        callback(null, `${out.join('\n')}`);
    });
    console.log(beginTip);
}
