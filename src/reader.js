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
import { providers } from './oembed/index.js';

// Add helper before template compilation
Handlebars.registerHelper('isUrl', function(str) {
  if (typeof str !== 'string') return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
});

Handlebars.registerHelper('strLength', function(str) {
  return str.length;
});

Handlebars.registerHelper('gt', function(a, b) {
  return a > b;
});

Handlebars.registerHelper('truncate', function(str, length) {
  return str.substring(0, length);
});

const TEMPLATE = Handlebars.compile(
  fs.readFileSync("html/template.html").toString()
);
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);
DOMPurify.setConfig({
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allowfullscreen', 'frameborder', 'src'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
});

export async function convertUrlToReader(url) {
  // Try oEmbed providers first
  for (const provider of providers) {
    if (provider.matches(url)) {
      try {
        const result = await provider.fetch(url);
        return result;
      } catch (error) {
        console.warn(`oEmbed failed for ${url}, falling back to parser:`, error);
        break;
      }
    }
  }

  // Fall back to regular parser
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
              const src = attrs.href.startsWith('data:') 
                ? attrs.href 
                : `/__/proxy?href=${encodeURIComponent(imageUrl)}`;
                
              return `<img
                      src="${src}"
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
    markdown: res.content,
    date_published: res.date_published
      ? new Date(res.date_published).toDateString()
      : "",
    ctx: JSON.stringify(res),
    favicon: getFavicon(domain),
    // No oembed_data for parser fallback
  };
}

export async function generateReaderView(url) {
  const context = await convertUrlToReader(url);
  return TEMPLATE(context);
}