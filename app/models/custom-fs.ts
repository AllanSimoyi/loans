import { readFile } from 'fs/promises';

export async function traverseFile(filePath: string) {
  const a = (await readFile(filePath)).toString();
  return a;
}
