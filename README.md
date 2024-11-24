# 📖 Reader

Reader is a simple self-hosted application that takes in a URL and converts it into reader-mode friendly content using the [postlight parser](https://github.com/postlight/parser). 

![Reader Screenshot](docs/images/screenshot.png)

# ⭐️ Features

- 🔖 Bookmarklet for one-click sanization
- 🔌 API to programmatically access reader mode content
- ☀️Light and 🌙Dark themes

# 🐳 Using docker (recommended)


```yaml
version: "3"
services:
  reader:
    image: reader
    ports:
      - 8080:8080
```

# 🛠️ Development

- `npm i`
- `node run dev`