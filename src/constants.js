import process from "node:process";

function GET_CONFIG(x, defaultValue = false) {
  const isEnabled = ![undefined, "no", "false", "0", "n"].includes(x?.toLowerCase());
  return isEnabled ? x : defaultValue;
}

export const PROXY_IMAGES = GET_CONFIG(process.env.PROXY_IMAGES, true);
export const PORT = GET_CONFIG(process.env.PORT, "8080");
export const HOST = GET_CONFIG(process.env.HOST, "0.0.0.0");