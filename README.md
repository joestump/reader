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
version: "3"
services:
  reader:
    image: reader
    ports:
      - 8080:8080
```

## 🛠️ Development

- `npm i`
- `node run dev`