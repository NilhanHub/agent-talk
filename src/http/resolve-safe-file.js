import { normalize, resolve } from "node:path";

export const resolveSafeFile = (rootDir, requestPath) => {
  const safePath = normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = resolve(rootDir, `.${safePath}`);

  if (!absolutePath.startsWith(resolve(rootDir))) {
    return null;
  }

  return absolutePath;
};
