/**
 * Web browser sensor adapter for PWA functionality
 * Provides limited sensor access through web APIs
 */
export class WebSensorAdapter {
  constructor() {
    this.isWeb = true;
    this.sensors = {
      accelerometer: null,
      gyroscope: null,
      magnetometer: null,
      geolocation: null
    };
  }

  async requestPermissions() {
    const permissions = [];
    
    // Request device motion (accelerometer/gyroscope)
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
      try {
        const motion = await DeviceMotionEvent.requestPermission();
        permissions.push({ type: 'motion', status: motion });
      } catch (e) {
        permissions.push({ type: 'motion', status: 'denied' });
      }
    }

    // Request device orientation (magnetometer)
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      try {
        const orientation = await DeviceOrientationEvent.requestPermission();
        permissions.push({ type: 'orientation', status: orientation });
      } catch (e) {
        permissions.push({ type: 'orientation', status: 'denied' });
      }
    }

    // Request geolocation
    if (navigator.geolocation) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        permissions.push({ type: 'geolocation', status: 'granted' });
      } catch (e) {
        permissions.push({ type: 'geolocation', status: 'denied' });
      }
    }

    return permissions;
  }

  startAccelerometer(callback) {
    if (typeof DeviceMotionEvent !== 'undefined') {
      const handler = (event) => {
        if (event.acceleration) {
          callback({
            x: event.acceleration.x || 0,
            y: event.acceleration.y || 0,
            z: event.acceleration.z || 0
          });
        }
      };
      
      window.addEventListener('devicemotion', handler);
      return () => window.removeEventListener('devicemotion', handler);
    }
    return null;
  }

  startGyroscope(callback) {
    if (typeof DeviceOrientationEvent !== 'undefined') {
      const handler = (event) => {
        callback({
          x: (event.beta || 0) * Math.PI / 180,  // Convert to rad/s
          y: (event.gamma || 0) * Math.PI / 180,
          z: (event.alpha || 0) * Math.PI / 180
        });
      };
      
      window.addEventListener('deviceorientation', handler);
      return () => window.removeEventListener('deviceorientation', handler);
    }
    return null;
  }

  startMagnetometer(callback) {
    // Web browsers don't have direct magnetometer access
    // Simulate with device orientation compass heading
    if (typeof DeviceOrientationEvent !== 'undefined') {
      const handler = (event) => {
        const heading = event.webkitCompassHeading || event.alpha || 0;
        // Convert compass heading to simulated magnetic field
        callback({
          x: Math.cos(heading * Math.PI / 180) * 50,
          y: Math.sin(heading * Math.PI / 180) * 50,
          z: 25 // Simulated vertical component
        });
      };
      
      window.addEventListener('deviceorientationabsolute', handler);
      return () => window.removeEventListener('deviceorientationabsolute', handler);
    }
    return null;
  }

  getBatteryInfo() {
    if (navigator.getBattery) {
      return navigator.getBattery().then(battery => ({
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      }));
    }
    
    // Fallback simulation
    return Promise.resolve({
      level: 0.5 + Math.random() * 0.5, // Random between 50-100%
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 7200 // 2 hours
    });
  }

  getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      type: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      online: navigator.onLine
    };
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              heading: position.coords.heading,
              speed: position.coords.speed
            },
            timestamp: position.timestamp
          });
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Web Audio API for State 51 signal generation
  createAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    return new AudioContext();
  }

  generateTone(frequency, duration, audioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
    
    return oscillator;
  }

  // Vibration API for haptic feedback
  vibrate(pattern) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
      return true;
    }
    return false;
  }

  // Screen wake lock for preventing sleep
  requestWakeLock() {
    if ('wakeLock' in navigator) {
      return navigator.wakeLock.request('screen');
    }
    return Promise.reject(new Error('Wake Lock not supported'));
  }

  // Detect if running in PWA mode
  isPWA() {
    return window.navigator.standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches;
  }

  // Get device info
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      isPWA: this.isPWA()
    };
  }

  // Web Storage for persistence
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default new WebSensorAdapter();