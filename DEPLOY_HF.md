# Deploy FLICKPICK Frontend to Hugging Face Spaces

## Prerequisites

1. [Hugging Face account](https://huggingface.co/join) (free)
2. Custom domain name (you already have one)
3. GitHub account

## Step 1: Create Hugging Face Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"**
3. Configure:
   - **Space name**: `flickpick-frontend`
   - **Owner**: Your username
   - **Visibility**: Public
   - **SDK**: Static HTML
   - **Hardware**: CPU basic (free)
   - **License**: MIT

4. Click **"Create Space"**

## Step 2: Push Frontend Code

```bash
# Navigate to frontend directory
cd "E:\Coding project\flickpick\frontend_hf"

# Initialize git (if not already)
git init

# Add Hugging Face remote
git remote add space https://huggingface.co/spaces/YOUR_USERNAME/flickpick-frontend

# Add all files
git add .

# Commit
git commit -m "Deploy FLICKPICK frontend to Hugging Face"

# Push to Hugging Face
git push space main
```

## Step 3: Configure API Endpoints

For Hugging Face deployment, you need to update the API URLs in the JavaScript files:

1. In `static/js/config.js`, update:
```javascript
// For Hugging Face deployment
const API_BASE_URL = 'https://your-django-backend.com';
const ML_API_URL = 'https://flickpick-ml-api.onrender.com';
```

2. Update all API calls in JavaScript files to use the Django backend URL.

## Step 4: Connect Custom Domain

### Option 1: Hugging Face Custom Domains (Recommended)

1. In your Space settings → **"Settings"** tab
2. Scroll to **"Custom Domain"**
3. Click **"Add a custom domain"**
4. Enter your domain: `your-domain.com`
5. Follow DNS instructions:
   - Add CNAME record: `www` → `huggingface.co`
   - Or A record pointing to Hugging Face IPs

### Option 2: Cloudflare (Advanced)

1. Sign up for [Cloudflare](https://cloudflare.com) (free)
2. Add your domain to Cloudflare
3. Set nameservers to Cloudflare
4. Create CNAME record: `www` → `your-space.hf.space`
5. Enable Cloudflare SSL/TLS

## Step 5: Update Django Backend CORS

In your Django `settings.py`, add Hugging Face domain:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",
    "https://www.your-domain.com",
    "https://your-space.hf.space",
    "http://localhost:3000",  # For development
]
```

## Step 6: Test Everything

1. Visit your custom domain
2. Test:
   - User registration/login
   - Movie browsing
   - Watchlist functionality
   - Recommendations
   - Profile page

## Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Hugging Face  │    │   Django Backend │    │   Render ML API │
│   Frontend      │◄──►│   (Your Server) │◄──►│   (Render.com)  │
│   (Static)      │    │   (API & Auth)   │    │   (ML Service)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                    Your Custom Domain
                   (your-domain.com)
```

## Troubleshooting

### CORS Errors
- Add your domain to Django CORS settings
- Check that API calls include proper headers

### 404 Errors
- Verify static files are loading
- Check file paths in HTML

### Authentication Issues
- Ensure cookies work across domains
- Check session configuration

### Slow Loading
- Hugging Face free tier has some limitations
- Consider upgrading for better performance

## Alternative: Netlify/Vercel

If Hugging Face has issues, you can also use:
- **Netlify**: Excellent for static sites
- **Vercel**: Great performance
- **GitHub Pages**: Simple and free

## Next Steps

1. Deploy to Hugging Face
2. Connect custom domain
3. Test all functionality
4. Monitor performance
5. Set up analytics (Google Analytics)

## Costs

- **Hugging Face**: Free tier sufficient
- **Render ML API**: Free tier (with sleep mode)
- **Domain**: ~$10-15/year
- **Django Backend**: VPS (~$5-10/month) or Railway/Render

**Total**: ~$15-25/month for full deployment
