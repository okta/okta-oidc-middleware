#! /usr/bin/env node

const fs = require('fs');
const globby = require('globby');
const path = require('path');

const bannerSourcePath = path.join(__dirname, 'license-template.txt');
const files = globby.sync(path.join(__dirname, '..','{index.js,index.ts,src/**/*.{js,ts},test/integration-test/*.{js,ts},test/e2e/**/*.{js,ts}}'));
//console.log(files);
const bannerSource = fs.readFileSync(bannerSourcePath).toString();
const copyrightRegex = /(Copyright \(c\) )([0-9]+)-Present/

files.forEach(file => {
  const contents = fs.readFileSync(file).toString();
  const match = contents.match(copyrightRegex);
  if (!match) {
    return fs.writeFileSync(file, bannerSource + '\n\n' + contents);
  }
});
