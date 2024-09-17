import { DOMParser } from '@xmldom/xmldom';
import type { Document } from '@xmldom/xmldom';
const parser = new DOMParser();

/**
 * Sends an HTTP request to a Roku device.
 *
 * @param uri - The request uri to send to the device. Use the endpoints object below to specify values for this.
 * @param method - The request method to send ("GET", "POST", etc).
 * @param ecp - This deterines whether to use port 8060 or not. Default is true.
 * @param body - Optional. The request body to send.
 * @param headers - The request headers to send.
 * @returns The response from the request, often an xml Document
 */
export const ECP = async (
  uri: string,
  method: string,
  ecp: boolean = true,
  body?: string | FormData | undefined,
  headers?: Record<string, string>,
): Promise<Response | Document> => {
  const url = ecp ? `http://${process.env.ROKU_IP}:8060` : `http://${process.env.ROKU_IP}`;
  const req: Request = new Request(`${url}/${uri}`);
  const options: RequestInit =
    headers === undefined ? { method: method, body: body } : { method: method, body: body, headers: headers };
  const response = await fetch(req, options);

  // If we've hit here, we've called getAuthHeader, return the response body to the function.
  if (response.headers.get('WWW-Authenticate') !== null) return response;
  // If the body is form-data, return the response body as-is.
  if (body instanceof FormData) return response;
  // If we get to here, we're pretty sure it's xml from the Roku.
  const xml = await response.text();
  const doc = parser.parseFromString(xml, 'text/xml');
  const errorNodes = doc.getElementsByTagName('parsererror');
  if (errorNodes.length > 0) {
    console.error(errorNodes[0]);
    throw new Error(`ECP ${method} request for ${uri} returned an error`);
  } else {
    return doc;
  }
};
