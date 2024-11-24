import createDOMPurify from "dompurify";
import Handlebars from "handlebars";
import {JSDOM} from "jsdom";
import {marked} from "marked";
import fs from "node:fs";
import { URL } from "node:url";
import https from 'node:https';

import Parser from "@postlight/parser";

import {PROXY_IMAGES} from "./constants.js";
import {getFavicon} from "./generate-favicon.js";

const TEMPLATE = Handlebars.compile(
  fs.readFileSync("html/template.html").toString()
);
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

export async function convertUrlToReader(url) {
  const res = await Parser.parse(url, {
    contentType: "markdown"
  });
  
  const domain = res.domain.replace("www.", "");
  const md = PROXY_IMAGES
    ? marked.use({
        renderer: {
          image(attrs) {
            try {
              const imageUrl = new URL(attrs.href);                
              return `<img
                      src="/__/proxy?href=${encodeURIComponent(imageUrl)}"
                      alt="${attrs.text}"${attrs.title ? `\ntitle="${attrs.title}"` : ""}
                  />`;
            } catch (error) {
              console.error('Failed to parse image URL:', attrs.href, error);
              return ''; // Skip invalid images
            }
          },
        },
      })
    : marked;

  return {
    ...res,
    domain,
    root: `https://${res.domain}`,
    content: DOMPurify.sanitize(md.parse(res.content)),
    date_published: res.date_published
      ? new Date(res.date_published).toDateString()
      : "",
    ctx: JSON.stringify(res),
    favicon: getFavicon(domain),
  };
}

export async function generateReaderView(url) {
  const context = await convertUrlToReader(url);
  return TEMPLATE(context);
}
