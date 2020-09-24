import path from "path-browserify";
import parse from "url-parse";
import urljoin from "url-join";

export const defaultSkynetPortalUrl = "https://siasky.net";

export const uriHandshakePrefix = "hns:";
export const uriHandshakeResolverPrefix = "hnsres:";
export const uriSkynetPrefix = "sia:";

export function addUrlQuery(url: string, query: Record<string, unknown>): string {
  const parsed = parse(url);
  parsed.set("query", query);
  return parsed.toString();
}

export function defaultOptions(endpointPath: string): Record<string, unknown> {
  return {
    endpointPath,
    APIKey: "",
    customUserAgent: "",
  };
}

// TODO: This will be smarter. See
// https://github.com/NebulousLabs/skynet-docs/issues/21.
export function defaultPortalUrl(): string {
  if (typeof window === "undefined") return "/"; // default to path root on ssr
  return window.location.origin;
}

function getFilePath(
  file: File & {
    webkitRelativePath?: string;
    path?: string;
  }
): string {
  return file.webkitRelativePath || file.path || file.name;
}

export function getRelativeFilePath(file: File): string {
  const filePath = getFilePath(file);
  const { root, dir, base } = path.parse(filePath);
  const relative = path.normalize(dir).slice(root.length).split(path.sep).slice(1);

  return path.join(...relative, base);
}

export function getRootDirectory(file: File): string {
  const filePath = getFilePath(file);
  const { root, dir } = path.parse(filePath);

  return path.normalize(dir).slice(root.length).split(path.sep)[0];
}

/**
 * Properly joins paths together to create a URL. Takes a variable number of
 * arguments.
 */
export function makeUrl(...args: string[]): string {
  return args.reduce((acc, cur) => urljoin(acc, cur));
}

const SKYLINK_MATCHER = "([a-zA-Z0-9_-]{46})";
const SKYLINK_DIRECT_REGEX = new RegExp(`^${SKYLINK_MATCHER}$`);
const SKYLINK_PATHNAME_REGEX = new RegExp(`^/?${SKYLINK_MATCHER}([/?].*)?$`);
const SKYLINK_REGEXP_MATCH_POSITION = 1;

export function parseSkylink(skylink: string): string {
  if (typeof skylink !== "string") throw new Error(`Skylink has to be a string, ${typeof skylink} provided`);

  // check for direct skylink match
  const matchDirect = skylink.match(SKYLINK_DIRECT_REGEX);
  if (matchDirect) return matchDirect[SKYLINK_REGEXP_MATCH_POSITION];

  // check for skylink prefixed with sia: or sia:// and extract it
  // example: sia:XABvi7JtJbQSMAcDwnUnmp2FKDPjg8_tTTFP4BwMSxVdEg
  // example: sia://XABvi7JtJbQSMAcDwnUnmp2FKDPjg8_tTTFP4BwMSxVdEg
  skylink = trimUriPrefix(skylink, uriSkynetPrefix);

  // check for skylink passed in an url and extract it
  // example: https://siasky.net/XABvi7JtJbQSMAcDwnUnmp2FKDPjg8_tTTFP4BwMSxVdEg

  // pass empty object as second param to disable using location as base url when parsing in browser
  const parsed = parse(skylink, {});
  const matchPathname = parsed.pathname.match(SKYLINK_PATHNAME_REGEX);
  if (matchPathname) return matchPathname[SKYLINK_REGEXP_MATCH_POSITION];

  throw new Error(`Could not extract skylink from '${skylink}'`);
}

export function trimUriPrefix(str: string, prefix: string): string {
  const longPrefix = `${prefix}//`;
  if (str.startsWith(longPrefix)) {
    // longPrefix is exactly at the beginning
    return str.slice(longPrefix.length);
  }
  if (str.startsWith(prefix)) {
    // else prefix is exactly at the beginning
    return str.slice(prefix.length);
  }
  return str;
}

export function concatUint8Arrays(array1: Uint8Array, array2: Uint8Array): Uint8Array {
  const result = new Uint8Array(array1.length + array2.length);
  result.set(array1);
  result.set(array2, array1.length);
  return result;
}

// From https://stackoverflow.com/a/60818105/6085242
export function areEqualUint8Arrays(array1: Uint8Array, array2: Uint8Array): boolean {
  return array1.length === array2.length && array1.every((value, index) => value === array2[index]);
}

// From http://www.java2s.com/example/nodejs/data-type/convert-ascii-to-uint8-array.html
/**
 * Converts an ASCII string to an array of bytes.
 */
export function asciiToUint8Array(str: string): Uint8Array {
  let chars = [];
  for (let i = 0; i < str.length; ++i){
    chars.push(str.charCodeAt(i));/*from  w  ww. j  a  v  a  2s.c o  m*/
  }
  return new Uint8Array(chars);
}

// From https://blog.abelotech.com/posts/generate-random-values-nodejs-javascript/
/**
 * Generates random integer between two numbers low (inclusive) and high
 * (exclusive) ([low, high)).
 */
export function randomInt(low: number, high: number): number {
  return Math.floor(Math.random() * (high - low) + low)
}

export function fillRandUint8Array(array: Uint8Array) {
  for (let i = 0; i < array.length; i++) {
    array[i] = randomInt(0, 256);
  }
}
