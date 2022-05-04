import fetch from 'cross-fetch';
import { EnvConfig } from './config';

export interface Token {
  access_token: string;
}

export const getToken = async (config: EnvConfig) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: 
      `grant_type=client_credentials` +
      `&scope=${encodeURIComponent(config.SCOPES)}` + 
      `&client_id=${encodeURIComponent(config.CLIENT_ID)}` +
      `&client_secret=${encodeURIComponent(config.CLIENT_SECRET)}`
  };
  return fetch(config.IMS_AUTHORITY, options)
    .then((response) => {
      if (response.ok) {
        return response.json() as Promise<Token>;
      } else {
        throw new Error(response.statusText);
      }
    })
    .catch((error) => {
      console.error(error);
      return undefined;
    });
};