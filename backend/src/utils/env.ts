import path from "path";
import dotenv from "dotenv";

const env = process.env.NODE_ENV || "des";
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) });

export default env;
