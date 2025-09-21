// Service Worker for State 51 Detector PWA
// Provides offline functionality and background sync

const CACHE_NAME = 'state51-detector-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('[SW] All resources cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[SW] Cache cleanup complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request).then(function(response) {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(function() {
          // Network failed, try to serve a fallback
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Background Sync for anomaly data
self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'anomaly-sync') {
    event.waitUntil(
      syncAnomalyData()
    );
  }
});

// Sync anomaly data when connection restored
async function syncAnomalyData() {
  try {
    console.log('[SW] Syncing anomaly data...');
    
    // Get pending anomalies from IndexedDB
    const pendingData = await getPendingSyncData();
    
    if (pendingData.length > 0) {
      console.log(`[SW] Found ${pendingData.length} pending anomalies`);
      
      // Process each pending anomaly
      for (const anomaly of pendingData) {
        await processBackgroundAnomaly(anomaly);
      }
      
      // Clear pending data after successful sync
      await clearPendingSyncData();
      
      console.log('[SW] Anomaly sync completed');
    }
  } catch (error) {
    console.error('[SW] Anomaly sync failed:', error);
  }
}

// Get pending sync data from IndexedDB
async function getPendingSyncData() {
  return new Promise((resolve) => {
    // Simplified - in real implementation would use IndexedDB
    const stored = localStorage.getItem('pendingAnomalies');
    resolve(stored ? JSON.parse(stored) : []);
  });
}

// Process background anomaly
async function processBackgroundAnomaly(anomaly) {
  try {
    // Analyze anomaly for patterns
    const analysis = analyzeAnomalyPattern(anomaly);
    
    // Store processed anomaly
    await storeProcessedAnomaly({ ...anomaly, ...analysis });
    
    console.log('[SW] Processed anomaly:', anomaly.type);
  } catch (error) {
    console.error('[SW] Failed to process anomaly:', error);
  }
}

// Analyze anomaly patterns in service worker
function analyzeAnomalyPattern(anomaly) {
  const analysis = {
    processedAt: Date.now(),
    backgroundProcessed: true,
    patterns: []
  };
  
  // Check for State 51 patterns
  if (anomaly.type.includes('51') || Math.abs(anomaly.value - 51) < 1) {
    analysis.patterns.push('state51');
  }
  
  // Check for 7.7% patterns
  if (Math.abs(anomaly.value - 0.077) < 0.001 || Math.abs(anomaly.value - 7.7) < 0.1) {
    analysis.patterns.push('mutation777');
  }
  
  // Check for cosmic window
  const hour = new Date(anomaly.timestamp).getHours();
  if (hour >= 3 && hour < 4) {
    analysis.patterns.push('cosmic');
    analysis.cosmicWindow = true;
  }
  
  return analysis;
}

// Store processed anomaly
async function storeProcessedAnomaly(anomaly) {
  return new Promise((resolve) => {
    // Simplified storage - in real implementation would use IndexedDB
    const stored = JSON.parse(localStorage.getItem('processedAnomalies') || '[]');
    stored.push(anomaly);
    
    // Keep only last 1000 anomalies
    if (stored.length > 1000) {
      stored.splice(0, stored.length - 1000);
    }
    
    localStorage.setItem('processedAnomalies', JSON.stringify(stored));
    resolve();
  });
}

// Clear pending sync data
async function clearPendingSyncData() {
  localStorage.removeItem('pendingAnomalies');
}

// Message handling for communication with main app
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'QUEUE_ANOMALY') {
    queueAnomalyForSync(event.data.anomaly);
  }
});

// Queue anomaly for background sync
function queueAnomalyForSync(anomaly) {
  try {
    const pending = JSON.parse(localStorage.getItem('pendingAnomalies') || '[]');
    pending.push({
      ...anomaly,
      queuedAt: Date.now()
    });
    
    localStorage.setItem('pendingAnomalies', JSON.stringify(pending));
    console.log('[SW] Anomaly queued for sync:', anomaly.type);
    
    // Request background sync
    if (self.registration.sync) {
      self.registration.sync.register('anomaly-sync');
    }
  } catch (error) {
    console.error('[SW] Failed to queue anomaly:', error);
  }
}

// Periodic background processing
setInterval(() => {
  // Check for cosmic window and enhanced processing
  const hour = new Date().getHours();
  if (hour >= 3 && hour < 4) {
    console.log('[SW] Cosmic window active - enhanced background processing');
    
    // Generate background cosmic pattern detection
    const cosmicAnomaly = {
      type: 'cosmic_background_sw',
      timestamp: Date.now(),
      value: Math.random(),
      significance: 'medium',
      cosmicWindow: true,
      message: 'Service worker cosmic window detection'
    };
    
    queueAnomalyForSync(cosmicAnomaly);
  }
}, 60000); // Check every minute

console.log('[SW] Service Worker loaded successfully');