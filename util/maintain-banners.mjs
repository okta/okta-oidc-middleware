#! /usr/bin/env node

import fs from 'fs';
import path from 'path';
import { globbySync } from 'globby';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const bannerSourcePath = path.join(__dirname, 'license-template.txt');
const files = globbySync(path.join(__dirname, '..','{index.js,index.ts,src/**/*.{js,ts},test/integration-test/*.{js,ts},test/e2e/**/*.{js,ts}}'));
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
