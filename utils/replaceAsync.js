/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * String replace with async function.
 */
export const replaceAsync = async (
  str,
  regex,
  asyncFn
) => {
  const promises = [];
  // @ts-ignore
  str.replace(regex, (match, ...args) => {
    // @ts-ignore
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
};
