/* eslint-disable no-console */
import { replaceAsync } from "./replaceAsync.js";

const IMAGE_MD_REGEX = /(?:!\[(.*?)\]\((https?:\/\/.*?)\))/;
const IMAGE_TAG_REGEX = /(?:<img.*?src=\"(.*?)\".*?>)/;

/**
 * Replace markdown image URLs with Linear uploaded ones.
 *
 * Also supports image tags used by GitHub.
 *
 * @param client Linear API client.
 * @param text Markdown content.
 * @param urlSuffix A suffix to append to each image URL, such as to perform authentication
 * @returns Markdown content with images using the new Linear URLs
 */
export const replaceImagesInMarkdown = async (
  client,
  text,
  urlSuffix
) => {
  let result = text;
  const effectiveURLSuffix = urlSuffix || "";

  // Markdown tags
  result = await replaceAsync(result, IMAGE_MD_REGEX, async (match, ...args) => {
    match;
    const title = args[0];
    const url = args[1];
    const uploadedUrl = await replaceImageUrl(client, url + effectiveURLSuffix);
    return `![${title}](${uploadedUrl})`;
  });

  // HTML tags
  result = await replaceAsync(result, IMAGE_TAG_REGEX, async (match, ...args) => {
    match;
    const url = args[0];
    const uploadedUrl = await replaceImageUrl(client, url + effectiveURLSuffix);
    return `![](${uploadedUrl})`;
  });

  return result;
};

/**
 * Downloads image and upload it to
 *
 * @param client Linear API client
 * @param url URL of the source image
 * @returns URL of the uploaded image
 */
const replaceImageUrl = async (client, url) => {
  try {
    const res = await client.imageUploadFromUrl(url);
    if (res?.url) {
      return res?.url;
    }
  } catch (err) {
    console.error(`Failed to replace image`, err.message);
  }

  return url;
};
