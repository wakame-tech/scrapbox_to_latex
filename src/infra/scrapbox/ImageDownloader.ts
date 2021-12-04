import { basename } from 'https://deno.land/std/path/mod.ts';
import { DocNode } from '../../domain/model/documents.ts';
import { writableStreamFromWriter } from 'https://deno.land/std@0.117.0/streams/mod.ts';
import { existsSync } from 'https://deno.land/std@0.117.0/fs/exists.ts';

export const urlToPath = (url: string): string => {
  return url.endsWith('.png') ? url : url.replace('/thumb/1000', '') + '.png';
};

export const downloadImage = async (dir: string, url: string) => {
  // in private project, image url must be 'https://gyazo.com/'
  const path = urlToPath(url);
  console.log(`Downloading ${path}`);
  const fileResponse = await fetch(path);
  if (!fileResponse.ok) {
    console.error(`Failed to download ${url}`);
    return;
  }

  if (fileResponse.body) {
    const fileName = `${dir}/` + basename(path);
    const file = await Deno.open(fileName, { write: true, create: true });
    const writableStream = writableStreamFromWriter(file);
    await fileResponse.body.pipeTo(writableStream);
  }
};

export const downloadImages = async (dir: string, docNodes: DocNode[]) => {
  for (const docNode of docNodes) {
    for (const block of docNode.page) {
      if (block.type === 'line') {
        for (const node of block.nodes) {
          if (node.type === 'image') {
            if (existsSync(`${dir}/${basename(urlToPath(node.src))}`)) {
              continue;
            }
            await downloadImage(dir, node.src);
          }
        }
      }
    }
  }
};
