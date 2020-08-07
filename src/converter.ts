/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

import fs from 'fs-extra';
import { join } from 'path';
import { IBM1047_to_ISO8859_1 } from './charmap';

let debugCharError = false;
let debugLimit = 10;
let debug = false;
let badCharLimit = 10;

interface ScanResult {
  type: FileType;
  data: Buffer;
}

export async function checkFile(path: string): Promise<void> {
  const stats = await fs.stat(path);
  if (stats.isDirectory()) {
    const files = await fs.readdir(path);
    for (const file of files) {
      if (['node_modules', '.git'].indexOf(file) !== -1) {
        continue;
      }
      const filePath = join(path, file);
      await checkFile(filePath);
    }
  } else {
    await convertFileIfNeeded(path);
  }
}

async function convertFileIfNeeded(file: string): Promise<void> {
  const { type, data } = await detectEncoding(file);
  if (type === 'IBM-1047') {
    await convertFile(file, data);
    console.log(`File ${file} converted to ISO-8558-1`);
  }
}

type FileType = 'ERROR' | 'EMPTY' | 'BOTH' | 'ISO8859-1' | 'IBM-1047' | 'NEITHER';

async function detectEncoding(filename: string): Promise<ScanResult> {
  let debugCount = 0;
  let bad_char_count = 0;
  let showedFilename = false;
  const data = await fs.readFile(filename);
  clearCounts();
  let pos = 0;
  for (pos = 0; pos < data.length; pos++) {
    const ch = data[pos];
    const iso8859Class = classify(ch);
    counts[0][iso8859Class]++;
    if (debugCharError && iso8859Class == 0 && counts[0][iso8859Class] < 10 && debugCount++ < debugLimit) {
      if (!showedFilename) {
        console.log('%s', filename);
        showedFilename = true;
      }
      console.log('ISO8859-1 char error at position=%d, char=0x%s', pos, ch.toString(16));
    }
    const ch_trans = IBM1047_to_ISO8859_1[ch];
    let ibm1047Class = classify(ch_trans);
    counts[1][ibm1047Class]++;
    if (debugCharError && ibm1047Class == 0 && counts[1][ibm1047Class] < 10 && debugCount++ < debugLimit) {
      if (!showedFilename) {
        console.log('%s', filename);
        showedFilename = true;
      }
      console.log('IBM-1047 char error at position=%d, char=0x%s', pos, ch.toString(16));
    }
    pos++;
  }
  if (debug) {
    showCounts();
  }
  if (0 == (counts[0][0] + counts[0][1] + counts[0][2] + counts[0][3])) {
    return { type: 'EMPTY', data };
  } else if (counts[0][0] <= badCharLimit && counts[1][0] <= badCharLimit) {
    if ((counts[0][0] == 0 && counts[0][3] == 0) && !((counts[1][0] == 0 && counts[1][3] == 0))) {
      return { type: 'ISO8859-1', data };
    } else if (!(counts[0][0] == 0 && counts[0][3] == 0) && ((counts[1][0] == 0 && counts[1][3] == 0))) {
      return { type: 'IBM-1047', data };
    } else if (counts[0][3] <= badCharLimit && counts[1][3] <= badCharLimit) {
      return { type: 'BOTH', data };
    } else if (counts[0][3] <= badCharLimit) {
      return { type: 'ISO8859-1', data };

    } else if (counts[1][3] <= badCharLimit) {
      return { type: 'IBM-1047', data };
    } else {
      return { type: 'BOTH', data };
    }
  } else if (counts[0][0] <= badCharLimit) {
    bad_char_count = counts[0][0];
    return { type: 'ISO8859-1', data };
  } else if (counts[1][0] <= badCharLimit) {
    bad_char_count = counts[0][0];
    return { type: 'IBM-1047', data };
  } else {
    return { type: 'NEITHER', data };
  }
}

/* 0x0009, 0x000A, 0x000B, 0x000C, 0x000D, 0x0085: common cc characters */
/* 0x0000-0x001F: unprintable */
/* 0x0020-0x007F: ASCII printable */
/* 0x00A0: unprintable */
/* 0x00A1-0x00FF: non-ASCII printable */
function classify(ch: number): number {
  return (ch == 0x09 || ch == 0x0A || ch == 0x0B || ch == 0x0C || ch == 0x0D || ch == 20 || ch == 0x85) ? 1 : (ch <= 0x1F || ch == 0xA0) ? 0 : (ch <= 0x7F) ? 2 : 3
}

let counts: number[][];

function clearCounts(): void {
  counts = [];
  for (let i = 0; i < 2; i++) {
    counts[i] = new Array(4);
    counts[i].fill(0);
  }
}

function showCounts(): void {
  for (let e = 0; e < 2; e++) {
    console.log('  %s: bad=%d whitespace=%d english=%d international=%d', (e == 0) ? 'ISO8559-1' : 'IBM-1047',
      counts[e][0], counts[e][1], counts[e][2], counts[e][3]);
  }
}

async function convertFile(path: string, data: Buffer): Promise<void> {
  convertData(data);
  fs.writeFile(path, data);
}

function convertData(data: Buffer): void {
  for (let pos = 0; pos < data.length; pos++) {
    const ch = data[pos];
    let converted = IBM1047_to_ISO8859_1[ch];
    if (converted === 0x85) {
      converted = 0x0a;
    }
    data[pos] = converted;
  }
}


/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
