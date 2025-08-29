# YouTube Downloader - Frontend

This is the frontend portion of the YouTube Video Downloader, designed to be deployed on Netlify.

## Configuration

Before deploying, update the API base URL in `script.js`:

```javascript
const API_BASE_URL = 'https://your-render-app.onrender.com';
```

Replace `your-render-app.onrender.com` with your actual Render backend URL.

## Deployment to Netlify

### Option 1: Drag & Drop
1. Zip the contents of this folder
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop the zip file to deploy

### Option 2: Git Deployment
1. Push this folder to a GitHub repository
2. Connect the repository to Netlify
3. Set build settings:
   - Build command: (leave empty)
   - Publish directory: `.` (root)

## Files Included

- `index.html` - Main webpage
- `style.css` - Styling
- `script.js` - Frontend JavaScript (configured for Render API)
- `netlify.toml` - Netlify configuration
- `_redirects` - Redirect rules for SPA
- `README.md` - This file

## Features

- Responsive design
- Cross-origin API calls to Render backend
- Progress tracking
- Error handling
- Auto-download functionality