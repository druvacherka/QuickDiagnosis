const { spawnSync } = require('child_process');
const path = require('path');

const p = spawnSync('python', [
    path.join(__dirname, 'server', 'services', 'predict.py'),
    'dummy',
    '["fever", "cough"]'
]);
console.log("STDOUT:", p.stdout.toString());
console.log("STDERR:", p.stderr.toString());
