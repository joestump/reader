## 📖 Reader

Reader is a simple self-hosted application that takes in a URL and converts it into reader-mode friendly content using the [postlight parser](https://github.com/postlight/parser). Reader includes an API to programmatically access reader mode content and makes a great content proxy for local LLMs and SearXNG.

![Reader Screenshot](docs/images/screenshot.png)

## ⭐️ Features

- 🔗 Supports any URL
- 😎 Easy on both human and LLM eyes
- 🔖 Bookmarklet for one-click sanization
- 🔌 API to programmatically access reader mode content
- ☀️Light and 🌙Dark themes

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

## 🛠️ Development

- `npm i`
- `node run dev`
