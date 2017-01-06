export function getLatestVersion() {
  return new Promise((resolve, reject) => {
    let exec = require('child_process').exec, child;

    child = exec('npm show arbor version',
      function (error: string, stdout: string) {
        if (error !== null) {
          reject(error);
        } else {
          resolve(stdout.toString().replace(/(\r\n|\n|\r)/gm, ''));
        }
      });
  });
}
