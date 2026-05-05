# Deploy FLICKPICK Frontend to Hugging Face Spaces

## Step 1: Prepare Your Files

The `frontend_hf` folder is already set up with:
- ✅ `index.html` - Main entry point (converted from Django template)
- ✅ `static/css/` - Stylesheets
- ✅ `static/js/` - JavaScript files
- ✅ `README.md` - Hugging Face metadata

## Step 2: Update Backend URL

Before deploying, update the Django backend URL in `static/js/config.js`:

```javascript
export const DJANGO_BACKEND_URL = 'https://your-django-backend.com';
```

Replace `https://your-django-backend.com` with your actual Django backend URL.

## Step 3: Deploy to Hugging Face

### Option A: Using Git (Recommended)

```bash
# Navigate to the frontend_hf directory
cd "E:\Coding project\flickpick\frontend_hf"

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial FLICKPICK frontend deployment"

# Add Hugging Face remote (replace USERNAME with your HF username)
git remote add space https://huggingface.co/spaces/USERNAME/flickpick-frontend

# Push to Hugging Face
git push space main
```

### Option B: Using Hugging Face Website

1. Go to https://huggingface.co/spaces
2. Click "Create new Space"
3. Configure:
   - **Space name**: `flickpick-frontend`
   - **Visibility**: Public
   - **SDK**: Static HTML
4. Upload files from `frontend_hf` folder

## Step 4: Configure Custom Domain (Optional)

1. In your Space settings → "Settings" tab
2. Scroll to "Custom Domain"
3. Click "Add a custom domain"
4. Enter your domain: `your-domain.com`
5. Follow DNS instructions provided by Hugging Face

## Step 5: Update Django Backend CORS

In your Django `settings.py`, add your Hugging Face domain:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-username-flickpick-frontend.hf.space",
    "https://your-domain.com",  # If using custom domain
    "http://localhost:8000",    # For local development
]
```

## Architecture After Deployment

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   Hugging Face Spaces   │     │      Render.com         │
│   (Static Frontend)     │────▶│   (Django Backend)      │
│   flickpick-frontend    │     │   flickpick-ml-api      │
└─────────────────────────┘     └─────────────────────────┘
         │                                   │
         │                                   │
         └──────────┬──────────────────────────┘
                    │
            Your Custom Domain
           (e.g., flickpick.com)
```

## Verification Checklist

- [ ] Frontend deployed on Hugging Face
- [ ] Django backend URL updated in config.js
- [ ] CORS settings updated in Django
- [ ] Custom domain connected (optional)
- [ ] Test login/logout functionality
- [ ] Test watchlist functionality
- [ ] Test recommendations loading

## Troubleshooting

### CORS Errors
- Ensure `CORS_ALLOWED_ORIGINS` includes your Hugging Face domain
- Check that credentials are being sent with requests

### API Not Connecting
- Verify `DJANGO_BACKEND_URL` is correct in config.js
- Check browser console for errors
- Ensure Django backend is running and accessible

### Static Files Not Loading
- Check browser console for 404 errors
- Verify file paths in index.html are correct (should be `static/...` not `/static/...`)

## Need Help?

Refer to `DEPLOY_HF.md` for more detailed instructions.

---

**Ready to deploy?** Follow Step 2 (update backend URL) then Step 3 (deploy to Hugging Face)! 🚀
