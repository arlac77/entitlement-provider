import { join } from 'path';
import { packageWalker } from 'npm-package-walker';

export async function kronosModules() {
  const modules = [];

  await packageWalker(
    async pkg => {
      if (
        pkg.keywords !== undefined &&
        pkg.keywords.find(
          k =>
            k === 'kronos-step' ||
            k === 'kronos-service' ||
            k === 'kronos-interceptor'
        )
      ) {
        modules.push(require(pkg.name));
        return false;
      }
      return true;
    },
    join(__dirname, '..'),
    ['dependencies']
  );

  return modules;
}

export function assign(dest, value, attributePath) {
  const m = attributePath.match(/^(\w+)\.(.*)/);

  if (m) {
    const key = m[1];
    if (dest[key] === undefined) {
      dest[key] = {};
    }
    assign(dest[key], value, m[1]);
  } else {
    dest[attributePath] = value;
  }
}
