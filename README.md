## 📖 Reader

Reader is a simple self-hosted application that takes in a URL and converts it into reader-mode friendly content using the [postlight parser](https://github.com/postlight/parser). Reader includes an API to programmatically access reader mode content and makes a great content proxy for local LLMs and SearXNG.

## ⭐️ Features

- 🔗 Supports any URL
- 🎥 Automatically convert some URLs to interactive embeds (YouTube, Vimeo, TikTok, etc.)
- 😎 Easy on both human and LLM eyes
- 🔖 Bookmarklet for one-click sanization
- 🔌 API to programmatically access reader mode content
- 🔌 Plugin framework for oEmbed providers
- ☀️ Light and 🌙 Dark themes

## Coming Soon

- 🔍 SearXNG plugin that redirects search results to Reader.
- 📰 FreshRSS plugin that converts feed item bodies with reader mode versions of the items' URLs.

## 📸 Screenshots

### Article View

![Reader Screenshot](docs/images/screenshot.png)

### Embed View

![Reader Embed Screenshot](docs/images/automatic-oembed.png)

## 🐳 Docker Compose

```yaml
---
services:
  reader:
    image: ghcr.io/joestump/reader:latest
    container_name: reader
    environment:
      - PORT=8080 # Port to run on
      - HOST=0.0.0.0 # Address to listen on
      - PROXY_IMAGES=true # Whether to proxy article images
    ports:
      - 8080:8080
    healthcheck:
      # Remember to update the healthcheck URL if you change the port
      test: ["CMD", "wget", "--quiet", "-O", "/dev/null", "http://localhost:8080"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped
```

## 🔌 API

Reader offers a simple API endpoint for programmatically accessing sanitized content from other applications. For instance, replacing content in your RSS feeds with a FreshRSS plugin or redirecting news sites to Reader from SearXNG results.

### `/content.json`

Returns a parsed version of the article in JSON format.

#### Request Parameters

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| `url`     | string | Yes      | The URL of the article you want to parse       |

#### Response Object

| Field            | Type   | Description                                          |
|-----------------|--------|------------------------------------------------------|
| `title`         | string | The article's title                                  |
| `content`       | string | The article's sanitized HTML content                 |
| `markdown`      | string | The article's content in Markdown format             |
| `domain`        | string | The website's domain without "www."                  |
| `root`          | string | The website's root URL                               |
| `date_published`| string | Publication date in readable format                  |
| `favicon`       | string | Data URL for the generated favicon                   |
| `oembed_data`   | object | Raw oEmbed data if available (YouTube, Vimeo, etc.) |

#### Example Request

```bash
curl -s "http://localhost:8080/content.json?url=https://vimeo.com/1009918448" | jq
```

#### Example Response

```yaml
{
  "title": "Arc'teryx Presents: 109 Below",
  "content": "\n        <div class=\"video-author\"><a href=\"https://vimeo.com/arcteryx\">Arc'teryx</a></div>\n        <div class=\"video-container\">\n          <iframe src=\"https://player.vimeo.com/video/1009918448?app_id=122963\" width=\"426\" height=\"240\" frameborder=\"0\" allow=\"autoplay; fullscreen; picture-in-picture; clipboard-write\" title=\"Arc'teryx Presents: 109 Below\"></iframe>\n        </div>\n        <div class=\"description\">A tale of resilience, grit and elite rescue volunteers going out of their way to save the lives of strangers, 109 BELOW traces how an attempted rescue on Mount Washington in 1982 changed not only the course of two climbers’ lives - but also the lives of the rescuers who attempted to save them, and the future of prosthetics, forever.\n\nFeaturing: Joe Lentini, Hugh Herr, Alexa Siegel, Paul Cormier\nDirector: Nick Martini\nFilmed & Produced by: Stept Studios\nExecutive Producers: Ben Osborne, Lex Hinson, Sarah Stewart\n\nMore info: https://events.arcteryx.com/film-tour</div>\n      ",
  "markdown": "# Arc'teryx Presents: 109 Below\n\nPosted by [Arc'teryx](https://vimeo.com/arcteryx)\n\n[![Arc'teryx Presents: 109 Below](https://i.vimeocdn.com/video/1927716396-1c91bd87b43b3e2188ec21ece46e6e877e6fee7792bd66ea40d4d38897d8c728-d_295x166)](https://vimeo.com/1009918448)\n\nA tale of resilience, grit and elite rescue volunteers going out of their way to save the lives of strangers, 109 BELOW traces how an attempted rescue on Mount Washington in 1982 changed not only the course of two climbers’ lives - but also the lives of the rescuers who attempted to save them, and the future of prosthetics, forever.\n\nFeaturing: Joe Lentini, Hugh Herr, Alexa Siegel, Paul Cormier\nDirector: Nick Martini\nFilmed & Produced by: Stept Studios\nExecutive Producers: Ben Osborne, Lex Hinson, Sarah Stewart\n\nMore info: https://events.arcteryx.com/film-tour",
  "domain": "vimeo.com",
  "root": "https://i.vimeocdn.com",
  "oembed_data": {
    "type": "video",
    "version": "1.0",
    "provider_name": "Vimeo",
    "provider_url": "https://vimeo.com/",
    "title": "Arc'teryx Presents: 109 Below",
    "author_name": "Arc'teryx",
    "author_url": "https://vimeo.com/arcteryx",
    "is_plus": "0",
    "account_type": "business",
    "html": "<iframe src=\"https://player.vimeo.com/video/1009918448?app_id=122963\" width=\"426\" height=\"240\" frameborder=\"0\" allow=\"autoplay; fullscreen; picture-in-picture; clipboard-write\" title=\"Arc'teryx Presents: 109 Below\"></iframe>",
    "width": 426,
    "height": 240,
    "duration": 829,
    "description": "A tale of resilience, grit and elite rescue volunteers going out of their way to save the lives of strangers, 109 BELOW traces how an attempted rescue on Mount Washington in 1982 changed not only the course of two climbers’ lives - but also the lives of the rescuers who attempted to save them, and the future of prosthetics, forever.\n\nFeaturing: Joe Lentini, Hugh Herr, Alexa Siegel, Paul Cormier\nDirector: Nick Martini\nFilmed & Produced by: Stept Studios\nExecutive Producers: Ben Osborne, Lex Hinson, Sarah Stewart\n\nMore info: https://events.arcteryx.com/film-tour",
    "thumbnail_url": "https://i.vimeocdn.com/video/1927716396-1c91bd87b43b3e2188ec21ece46e6e877e6fee7792bd66ea40d4d38897d8c728-d_295x166",
    "thumbnail_width": 295,
    "thumbnail_height": 166,
    "thumbnail_url_with_play_button": "https://i.vimeocdn.com/filter/overlay?src0=https%3A%2F%2Fi.vimeocdn.com%2Fvideo%2F1927716396-1c91bd87b43b3e2188ec21ece46e6e877e6fee7792bd66ea40d4d38897d8c728-d_295x166&src1=http%3A%2F%2Ff.vimeocdn.com%2Fp%2Fimages%2Fcrawler_play.png",
    "upload_date": "2024-09-16 11:55:06",
    "video_id": 1009918448,
    "uri": "/videos/1009918448"
  }
}
```

## 🛠️ Development

- `npm i`
- `node run dev`
