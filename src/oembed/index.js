import { JSDOM } from 'jsdom';

class OEmbedProvider {
    constructor(name, endpoint, transformFn) {
      this.name = name;
      this.endpoint = endpoint;
      this.transformFn = transformFn;
    }
  
    async discoverOembed(url) {
      try {
        const response = await fetch(url);
        const text = await response.text();
        const dom = new JSDOM(text);
        const doc = dom.window.document;
        
        // Look for oEmbed link tags
        const oembedLink = doc.querySelector('link[type="application/json+oembed"]');
        if (oembedLink) {
          const oembedUrl = oembedLink.getAttribute('href');
          const oembedResponse = await fetch(oembedUrl);
          return await oembedResponse.json();
        }
      } catch (error) {
        console.log('oEmbed discovery failed:', error);
        return null;
      }
    }
  
    async fetch(url) {
      try {
        // Try auto-discovery first
        const discoveredData = await this.discoverOembed(url);
        if (discoveredData) {
          const result = this.transformFn(discoveredData, url);
          return { ...result, oembed_data: discoveredData };
        }
  
        // Fall back to known endpoint
        if (this.endpoint) {
          const oembedUrl = `${this.endpoint}?url=${encodeURIComponent(url)}&format=json`;
          const response = await fetch(oembedUrl);
          
          if (!response.ok) {
            throw new Error(`oEmbed request failed: ${response.statusText}`);
          }
          
          const data = await response.json();
          const result = this.transformFn(data, url);
          // Override description if it exists in oEmbed data
          if (data.description) {
            result.content = result.content.replace(
              /<div class="description">.*?<\/div>/s,
              `<div class="description">${data.description}</div>`
            );
          }
          return { ...result, oembed_data: data };
        }
  
        // Fall back to basic transform with empty data
        return this.transformFn({}, url);
      } catch (error) {
        console.error(`oEmbed error for ${this.name}:`, error);
        throw error;
      }
    }
  
    matches(url) {
      return url.includes(this.name);
    }
  }
  
  // Helper function for common fields
  const createBaseResult = (data, url) => {
    console.log('Provider name:', data.provider_name);
    
    const domain = data.provider_name?.toLowerCase().replace(/\s+/g, '') + '.com';
    
    return {
      title: data.title || '',
      author: data.author_name || '',
      author_url: data.author_url || '',
      siteName: data.provider_name || '',
      domain: domain,
      url: url,
      root: `https://www.${domain}`,
      length: 0,
      excerpt: data.title || '',
    };
  };
  
  // Provider Implementations
  const vimeoProvider = new OEmbedProvider(
    'vimeo.com',
    'https://vimeo.com/api/oembed.json',
    (data, url) => ({
      ...createBaseResult(data, url),
      root: 'https://i.vimeocdn.com',
      content: `
        <div class="video-author"><a href="${data.author_url}">${data.author_name}</a></div>
        <div class="video-container">
          ${data.html}
        </div>
        <div class="description">${data.description || ''}</div>
      `,
      markdown: `
# ${data.title}

Posted by [${data.author_name}](${data.author_url})

[![${data.title}](${data.thumbnail_url})](${url})

${data.description || ''}
      `.trim()
    })
  );
  
  const tiktokProvider = new OEmbedProvider(
    'tiktok.com',
    'https://www.tiktok.com/oembed',
    (data, url) => ({
      ...createBaseResult(data, url),
      content: `
        <div class="tiktok-embed">${data.html}</div>
      `,
      markdown: `
# ${data.title}

[View on TikTok](${url})
      `.trim()
    })
  );
  
  const soundcloudProvider = new OEmbedProvider(
    'soundcloud.com',
    'https://soundcloud.com/oembed',
    (data, url) => ({
      ...createBaseResult(data, url),
      content: `
        <div class="soundcloud-author"><a href="${data.author_url}">${data.author_name}</a></div>
        <div class="soundcloud-player">${data.html}</div>
        ${data.description ? `<div class="description">${data.description}</div>` : ''}
      `,
      markdown: `
# ${data.title}

By [${data.author_name}](${data.author_url})

${data.description || ''}

[Listen on SoundCloud](${url})
      `.trim()
    })
  );
  
  const spotifyProvider = new OEmbedProvider(
    'spotify.com',
    'https://open.spotify.com/oembed',
    (data, url) => ({
      ...createBaseResult(data, url),
      content: `
        <div class="spotify-embed">${data.html}</div>
      `,
      markdown: `
# ${data.title}

[Listen on Spotify](${url})
      `.trim()
    })
  );
  
  const flickrProvider = new OEmbedProvider(
    'flickr.com',
    'https://www.flickr.com/services/oembed',
    (data, url) => ({
      ...createBaseResult(data, url),
      content: `
        <div class="flickr-photo">
          <img src="${data.url}" alt="${data.title}" />
          <div class="photo-credit">Photo by <a href="${data.author_url}">${data.author_name}</a></div>
        </div>
      `,
      markdown: `
# ${data.title}

![${data.title}](${data.url})

Photo by [${data.author_name}](${data.author_url})
      `.trim()
    })
  );
  
  const youtubeProvider = new OEmbedProvider(
    'youtube.com',
    'https://www.youtube.com/oembed',
    (data, url) => {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      
      return {
        ...createBaseResult(data, url),
        content: `
          <div class="video-author">
            <a href="${data.author_url}">${data.author_name}</a>
          </div>
          <div class="video-container">
            ${data.html || `
              <iframe 
                width="420" 
                height="315" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=0" 
                frameborder="0" 
                allowfullscreen>
              </iframe>
            `}
          </div>
          <div class="description">${data.description || ''}</div>
        `,
        markdown: `
# ${data.title}

Posted by [${data.author_name}](${data.author_url})

[![${data.title}](http://img.youtube.com/vi/${videoId}/0.jpg)](http://www.youtube.com/watch?v=${videoId} "${data.title}")

${data.description || ''}
        `.trim()
      };
    }
  );
  
  export const providers = [
    youtubeProvider,
    vimeoProvider,
    tiktokProvider,
    soundcloudProvider,
    spotifyProvider,
    flickrProvider
  ];