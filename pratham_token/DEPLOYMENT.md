# Deployment Guide for Render

## Step-by-Step Deployment Instructions

### 1. Prepare Your Repository

1. Make sure all files are committed to your Git repository
2. Ensure your repository is public or connected to Render

### 2. Deploy on Render

#### Option A: Automatic Deployment (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Render will automatically detect the `render.yaml` configuration
5. Click "Create Web Service"

#### Option B: Manual Configuration

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `pratham-token` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `chmod +x install-aos.sh && ./install-aos.sh && npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose your preferred plan (Free tier available)

### 3. Environment Variables

The following environment variables are automatically set:
- `NODE_ENV`: production
- `PORT`: Automatically assigned by Render

### 4. Deployment Process

The deployment will:
1. Install AOS CLI
2. Install Node.js dependencies
3. Build the React frontend
4. Start the server

### 5. Access Your Application

Once deployed, you'll get a URL like:
`https://your-app-name.onrender.com`

### 6. Verify Deployment

1. Visit your application URL
2. Check that the React frontend loads
3. Test WebSocket functionality by trying to mint/burn tokens
4. Check Render logs for any errors

## Troubleshooting

### Common Issues

1. **Build Fails**: Check the build logs in Render dashboard
2. **AOS Not Found**: The install-aos.sh script should handle this
3. **WebSocket Connection**: Ensure the frontend connects to the correct WebSocket URL

### Checking Logs

1. Go to your service in Render dashboard
2. Click on "Logs" tab
3. Look for any error messages during build or runtime

### Manual AOS Installation

If the automatic installation fails, you can manually install AOS:

```bash
# In Render shell or locally
curl -L https://github.com/arweave-foundation/ao/releases/latest/download/aos-linux-x64 -o aos
chmod +x aos
sudo mv aos /usr/local/bin/
```

## Local Testing

Before deploying, test locally:

```bash
# Install dependencies
npm install
cd test && npm install

# Build frontend
npm run build

# Start server
npm start
```

Visit `http://localhost:3000` to test the application.

## Support

If you encounter issues:
1. Check the Render logs
2. Verify AOS CLI is installed: `aos --version`
3. Test WebSocket connection locally first
4. Check the browser console for any frontend errors 