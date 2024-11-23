import Fastify from "fastify";
import fs from "node:fs";
import process from 'node:process';

import {extensions, imageProxy} from "./image-proxy.js";
import {generateReaderView} from "./reader.js";
import {PORT, HOST} from "./constants.js";

const fastify = Fastify({logger: true});
const INDEX_HTML = fs.readFileSync("html/index.html").toString();

fastify.get("/", async ({query}, res) => {
  const {url} = query;

  if (url) {
    const result = await generateReaderView(url);
    return res.type("text/html").send(result);
  }
  res.type("text/html").send(INDEX_HTML);
});

fastify.get("/__/proxy", async (request, res) => {
  const {href} = request.query;
  const extension = request.headers.accept?.includes("avif")
    ? extensions.avif
    : extensions.webp;
  const {buf, mt} = await imageProxy(href, extension);
  res
    .type(mt)
    .headers({"cache-control": "max-age=86400, s-maxage=86400, public"})
    .send(buf);
});
fastify.get("/favicon.ico", (_, res) => res.send(""));
fastify.get("*", async (request, res) => {
  const url = request.url.substring(1);
  const result = await generateReaderView(url);
  return res.type("text/html").send(result);
});

// Run the server
fastify.listen(
  {port: PORT, host: HOST},
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening on ${address}`);
  }
);
fastify.addHook("onError", (request, reply, error, done) => {
  // Some code
  console.log(error);
  done();
});

process.on('SIGTERM', async () => {
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await fastify.close();
  process.exit(0);
});
