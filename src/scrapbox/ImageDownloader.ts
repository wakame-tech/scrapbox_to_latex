import { basename } from 'https://deno.land/std/path/mod.ts';
import { writableStreamFromWriter } from 'https://deno.land/std@0.117.0/streams/mod.ts';

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