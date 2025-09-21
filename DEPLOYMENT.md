# State 51 Detector - Deployment Guide

## Distribution Options

### 🌐 Option 1: PWA via GitHub Pages (Recommended)

The app now supports Progressive Web App (PWA) functionality with limited sensor access through web APIs.

#### Quick Deploy to GitHub Pages:

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial State 51 Detector app"
   git branch -M main
   git remote add origin https://github.com/yourusername/state51-detector.git
   git push -u origin main
   ```

2. **Build and Deploy**
   ```bash
   npm install
   npm run build
   npm run deploy
   ```

3. **Access Your App**
   - URL: `https://yourusername.github.io/state51-detector`
   - Works on any modern browser
   - Can be "installed" as PWA on mobile devices

#### PWA Features:
- ✅ Offline functionality
- ✅ Install to home screen
- ✅ Basic sensor access (accelerometer, gyroscope, battery)
- ✅ Geolocation
- ✅ Audio generation
- ✅ Vibration (mobile only)
- ⚠️ Limited magnetometer access
- ⚠️ No background monitoring

### 📱 Option 2: Native Mobile App

For full sensor access and background monitoring:

#### Expo Go (Development):
```bash
npm install -g expo-cli
npm install
expo start
```
Scan QR code with Expo Go app

#### Production Build:
```bash
# Android APK
expo build:android

# iOS IPA (requires Apple Developer account)
expo build:ios
```

### 🔗 Option 3: Direct APK Distribution

Create downloadable APK file:

1. **Build APK**
   ```bash
   expo build:android --type apk
   ```

2. **Download and Share**
   - Get download link from Expo build page
   - Share APK file directly
   - Users enable "Unknown Sources" to install

## GitHub Pages Setup (Detailed)

### 1. Prepare Repository

```bash
# Clone your repo
git clone https://github.com/yourusername/state51-detector.git
cd state51-detector

# Install dependencies
npm install
```

### 2. Configure for GitHub Pages

Add to `package.json`:
```json
{
  "homepage": "https://yourusername.github.io/state51-detector"
}
```

### 3. Build and Deploy

```bash
# Build web version
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### 4. Enable GitHub Pages

1. Go to repository Settings
2. Scroll to "Pages" section
3. Source: Deploy from branch
4. Branch: `gh-pages`
5. Save

### 5. Access Your App

App will be available at: `https://yourusername.github.io/state51-detector`

## PWA Installation Instructions

### Mobile (iOS/Android):
1. Open app URL in Safari/Chrome
2. Tap share button
3. "Add to Home Screen"
4. App appears as native app icon

### Desktop (Chrome/Edge):
1. Open app URL
2. Click install icon in address bar
3. "Install State 51 Detector"
4. App opens in standalone window

## Configuration for Your Use

### 1. Update App Metadata

Edit `app.json`:
```json
{
  "expo": {
    "name": "Your State 51 Detector",
    "slug": "your-state51-detector"
  }
}
```

### 2. Customize PWA Manifest

Edit `public/manifest.json`:
```json
{
  "name": "Your State 51 Detector",
  "short_name": "State51"
}
```

### 3. Add Your Icons

Replace files in `public/`:
- `favicon.ico` (16x16, 32x32)
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

## Browser Compatibility

### Full Support:
- ✅ Chrome/Chromium (Desktop & Mobile)
- ✅ Safari (iOS 13+)
- ✅ Edge (Chromium-based)
- ✅ Firefox (limited sensor access)

### Sensor Support by Browser:

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Accelerometer | ✅ | ✅ | ⚠️ | ✅ |
| Gyroscope | ✅ | ✅ | ⚠️ | ✅ |
| Magnetometer | ⚠️ | ⚠️ | ❌ | ⚠️ |
| Battery API | ✅ | ❌ | ❌ | ✅ |
| Geolocation | ✅ | ✅ | ✅ | ✅ |
| Audio | ✅ | ✅ | ✅ | ✅ |
| Vibration | ✅ | ❌ | ✅ | ✅ |

## Security Considerations

### HTTPS Required
- Sensor APIs require HTTPS
- GitHub Pages provides HTTPS automatically
- Local development uses HTTP (limited sensors)

### Permissions
- Sensors require user permission
- Permissions requested on first interaction
- Some features require user gesture

### Privacy
- All data stored locally
- No external data transmission
- User controls all data export

## Testing Your Deployment

### 1. Functional Test
```bash
# Test locally first
npm run web
# Open http://localhost:19006
```

### 2. PWA Features Test
- Install to home screen
- Test offline functionality
- Verify sensor permissions
- Check background sync

### 3. Cross-Browser Test
- Test on multiple browsers
- Verify mobile compatibility
- Check sensor access on each platform

## Troubleshooting

### Common Issues:

1. **Sensors Not Working**
   - Ensure HTTPS connection
   - Check browser compatibility
   - Grant permissions when prompted

2. **PWA Not Installing**
   - Verify manifest.json
   - Check service worker registration
   - Ensure HTTPS

3. **Build Failures**
   ```bash
   # Clear cache and reinstall
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

4. **GitHub Pages Not Updating**
   - Check Actions tab for build status
   - Verify gh-pages branch exists
   - Clear browser cache

### Performance Tips:

- Use during 3-4 AM for optimal detection
- Enable all available permissions
- Keep device stable during calibration
- Clear old data regularly

## Comparison: PWA vs Native

| Feature | PWA (GitHub Pages) | Native App |
|---------|-------------------|------------|
| **Distribution** | Direct URL access | App store/APK |
| **Installation** | Browser install | Traditional install |
| **Updates** | Automatic | Manual/Store |
| **Sensor Access** | Limited | Full access |
| **Background** | Service worker | Full background |
| **Storage** | LocalStorage/IndexedDB | SQLite |
| **Notifications** | Web notifications | Native notifications |
| **Offline** | Cached resources | Full offline |

## Recommended Setup

For personal research use:

1. **Start with PWA** for easy access and testing
2. **Use native app** for serious data collection
3. **Run both** to compare sensor differences
4. **Export data** regularly for analysis

---

**Quick Start Command:**
```bash
git clone <your-repo>
cd state51-detector
npm install
npm run deploy
```

Your State 51 Detector will be live at `https://yourusername.github.io/state51-detector` in minutes! 🚀