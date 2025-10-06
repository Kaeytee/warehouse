# Production Deployment Guide

This guide will help you deploy the Vanguard Cargo Warehouse Management System to production.

## 🚀 Quick Start - Switch to Production

### 1. Environment Setup

Make sure your `.env.production` file is configured with your real API endpoints:

```bash
# Production Environment Variables
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.Vanguard-cargo.com/api
VITE_APP_NAME=Vanguard Warehouse
VITE_DEBUG_MODE=false
VITE_MOCK_AUTH=false
VITE_LOG_LEVEL=error
```

### 2. Build for Production

```bash
# Build for production (uses .env.production)
npm run build:prod

# Or build for development testing (uses .env.development)
npm run build:dev
```

### 3. Preview Production Build

```bash
# Preview the production build locally
npm run preview:prod
```

### 4. Deploy

```bash
# Complete production build and preview
npm run start
```

## 🔧 Development vs Production

### Development Mode
- Uses mock authentication by default
- Debug logging enabled
- Development API endpoints
- Hot reload enabled

```bash
# Development with mock data
npm run dev

# Development with real API (set VITE_MOCK_AUTH=false)
npm run dev:api
```

### Production Mode
- Real API authentication
- Error-only logging
- Production API endpoints
- Optimized build

```bash
# Production build
npm run build:prod
```

## 📝 Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `VITE_APP_ENV` | development | production | Current environment |
| `VITE_API_BASE_URL` | http://localhost:3001/api | https://api.Vanguard-cargo.com/api | API base URL |
| `VITE_MOCK_AUTH` | true | false | Use mock authentication |
| `VITE_DEBUG_MODE` | true | false | Enable debug features |
| `VITE_LOG_LEVEL` | debug | error | Logging level |

## 🔐 Authentication System

The app automatically switches between mock and real authentication based on environment:

### Development (Mock Authentication)
- Uses predefined test credentials
- No real API calls for auth
- Perfect for development and testing

### Production (Real API Authentication)
- Makes actual API calls to your backend
- Real user validation
- Production security measures

## 📦 Deployment Options

### Option 1: Static Hosting (Vercel, Netlify, etc.)

1. Build the production version:
```bash
npm run build:prod
```

2. Deploy the `dist` folder to your hosting service

3. Set environment variables in your hosting platform:
   - `VITE_API_BASE_URL=https://your-api.com/api`
   - `VITE_MOCK_AUTH=false`

### Option 2: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Option 3: Server Deployment

1. Upload built files to your server
2. Configure web server (Apache/Nginx) to serve static files
3. Set up reverse proxy for API calls if needed

## 🧪 Testing Production Build

1. **Build the app:**
```bash
npm run build:prod
```

2. **Run type checking:**
```bash
npm run type-check
```

3. **Preview locally:**
```bash
npm run preview:prod
```

4. **Test with real API:**
   - Update `.env.production` with your API URL
   - Test login functionality
   - Verify all features work

## 🔍 Troubleshooting

### Common Issues

1. **Environment variables not loading:**
   - Ensure variable names start with `VITE_`
   - Check `.env.production` file exists
   - Rebuild after changes

2. **API calls failing:**
   - Verify `VITE_API_BASE_URL` is correct
   - Check CORS configuration on your API
   - Ensure `VITE_MOCK_AUTH=false` in production

3. **Authentication not working:**
   - Confirm your API endpoints match expected format
   - Check API responses match expected structure
   - Verify token handling in API service

### Debug Production Issues

1. **Enable debug mode temporarily:**
```bash
# In .env.production
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

2. **Check browser console for errors**

3. **Verify API connectivity:**
```bash
# Test API endpoint directly
curl https://your-api.com/api/health
```

## 🎯 Performance Optimization

The build process automatically:
- ✅ Minifies JavaScript and CSS
- ✅ Optimizes images
- ✅ Tree-shakes unused code
- ✅ Generates source maps for debugging
- ✅ Splits code into chunks for better loading

## 🔒 Security Considerations

1. **API Security:**
   - Use HTTPS in production
   - Implement proper CORS policies
   - Validate all inputs server-side

2. **Environment Variables:**
   - Never put secrets in frontend env vars
   - Use backend proxy for sensitive operations

3. **Authentication:**
   - Implement proper session management
   - Use secure HTTP-only cookies for tokens
   - Add rate limiting to login endpoints

## 📊 Monitoring

Add these to your production setup:
- **Error tracking** (Sentry, Bugsnag)
- **Analytics** (Google Analytics, Mixpanel)
- **Performance monitoring** (Web Vitals)
- **Uptime monitoring** (Pingdom, UptimeRobot)

---

## Quick Commands Summary

```bash
# Development
npm run dev              # Dev with mock auth
npm run dev:api          # Dev with real API

# Building
npm run build:dev        # Development build
npm run build:prod       # Production build

# Testing
npm run preview          # Preview development build
npm run preview:prod     # Preview production build
npm run type-check       # Type checking only

# Production
npm run start           # Build & preview production
```

Your warehouse app is now production-ready! 🚀
