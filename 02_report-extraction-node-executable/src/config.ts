import * as dotenv from "dotenv";
import { ParsedArgs } from "minimist";

export interface EnvConfig {
  IMS_AUTHORITY: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  SCOPES: string;
}

export const loadConfig = (argv: ParsedArgs): EnvConfig => {
  // Load environment variables from .env file
  const result = dotenv.config();
  if (result.error)
    throw result.error;

  if (!process?.env?.IMS_AUTHORITY) throw new Error("Missing required environment variable: IMS_AUTHORITY");
  if (!process?.env?.CLIENT_ID) throw new Error("Missing required environment variable: CLIENT_ID");
  if (!process?.env?.CLIENT_SECRET) throw new Error("Missing required environment variable: CLIENT_SECRET");
  if (!process?.env?.SCOPES) throw new Error("Missing required environment variable: SCOPES");

  return {
    IMS_AUTHORITY: process.env.IMS_AUTHORITY,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    SCOPES: process.env.SCOPES,
  };
}
