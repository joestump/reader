// Disable SSL verification globally
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import Fastify from "fastify";
import fs from "node:fs";
import Handlebars from "handlebars";
import process from 'node:process';

import {extensions, imageProxy} from "./image-proxy.js";
import {convertUrlToReader, generateReaderView} from "./reader.js";
import {PORT, HOST} from "./constants.js";

const fastify = Fastify({logger: true});
const INDEX_TEMPLATE = Handlebars.compile(fs.readFileSync("html/index.html").toString());

// Register the base template
const baseTemplate = fs.readFileSync("html/base.html").toString();
Handlebars.registerPartial("base", baseTemplate);

fastify.get("/", async (request, reply) => {
  const {url} = request.query;

  if (url) {
    const result = await generateReaderView(url);
    return reply.type("text/html").send(result);
  }

  const protocol = request.protocol;
  const host = request.headers.host;
  const baseUrl = `${protocol}://${host}`;
  
  const html = INDEX_TEMPLATE({ baseUrl });
  
  reply.type("text/html").send(html);
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
fastify.get("/content.json", async (request, reply) => {
  const {url} = request.query;
  
  if (!url) {
    return reply.code(400).send({ error: "URL parameter is required" });
  }
  
  const result = await convertUrlToReader(url);
  const {ctx, ...cleanResult} = result;
  return reply.type("application/json").send(cleanResult);
});
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
