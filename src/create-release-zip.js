const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, '../trello-extension-v1.0.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Release zip file created successfully.');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Append files from the root directory, ignoring node_modules and other non-extension files
archive.glob('**/*', {
  cwd: path.join(__dirname, '../'),
  ignore: ['node_modules/**', 'scripts/**', '*.zip', '.git/**', '.gitignore', 'package.json', 'package-lock.json', 'README.md']
});

archive.finalize();