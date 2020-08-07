/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

import { exit } from 'process';
import fs from 'fs-extra';
import { checkFile } from './converter';

function help(): void {
  const prog = process.argv[1];
  console.log(`Usage:`);
  console.log(`       ${prog} [plugin-path] [output-path]`);
}

async function main(): Promise<void> {
  if (process.argv.length !== 4) {
    help();
    exit(1);
  }
  const pluginPath = process.argv[2];
  const outputPath = process.argv[3];
  try {
    await fs.copy(pluginPath, outputPath);
    await checkFile(outputPath);
  } catch (e) {
    console.error(e.message);
  }
}

main();


/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
