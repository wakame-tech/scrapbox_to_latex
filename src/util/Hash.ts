import { createHash } from 'https://deno.land/std/hash/mod.ts';

export const toHash = (text: string): string => {
  const hash = createHash('md5');
  hash.update(text);
  return hash.toString();
};
