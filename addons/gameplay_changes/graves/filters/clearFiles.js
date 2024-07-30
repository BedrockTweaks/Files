const fs = require('fs');

const clearFiles = () => {
  const files = [
    './BP/manifest.json',
    './BP/pack_icon.png',
    './RP/manifest.json',
    './RP/pack_icon.png',
  ];

  files.forEach((file) => {
    fs.access(file, fs.constants.F_OK, (err) => {
      if (!err) {
        fs.unlink(file, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
          }
        });
      }
    });
  });
};

clearFiles();
