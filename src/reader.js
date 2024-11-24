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
DOMPurify.setConfig({
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allowfullscreen', 'frameborder', 'src'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
});

export async function convertUrlToReader(url) {
  const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
  
  if (videoId) {
    return convertYouTubeToReader(url, videoId);
  }

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
    markdown: res.content,
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

async function convertYouTubeToReader(url, videoId) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const response = await fetch(oembedUrl);
  const data = await response.json();

  const content = `
    <div class="video-author">
      <a href="${data.author_url}">${data.author_name}</a>
    </div>
    <div class="video-container">
      <iframe 
        width="420" 
        height="315" 
        src="https://www.youtube.com/embed/${videoId}?autoplay=0" 
        frameborder="0" 
        allowfullscreen>
      </iframe>
    </div>
    <div class="description">
      ${data.description || ''}
    </div>
  `;

  // Updated markdown with clickable thumbnail
  const markdown = `
# ${data.title}

Posted by [${data.author_name}](${data.author_url})

[![${data.title}](http://img.youtube.com/vi/${videoId}/0.jpg)](http://www.youtube.com/watch?v=${videoId} "${data.title}")

${data.description || ''}
  `.trim();

  return {
    title: data.title,
    content: DOMPurify.sanitize(content),
    markdown,
    textContent: `${data.title} - ${data.author_name}`,
    length: content.length,
    excerpt: data.title,
    siteName: 'YouTube',
    domain: 'youtube.com',
    root: 'https://youtube.com',
    favicon: 'https://www.youtube.com/favicon.ico',
    date_published: '',
    byline: data.author_name,
    author: data.author_name,
    author_url: data.author_url
  };
}
