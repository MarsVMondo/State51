import * as Battery from 'expo-battery';
import * as Cellular from 'expo-cellular';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import * as Sensors from 'expo-sensors';
import * as Device from 'expo-device';
import DatabaseService from './DatabaseService';

/**
 * Comprehensive sensor monitoring for State 51 effects detection
 */
class SensorMonitor {
  constructor() {
    this.isMonitoring = false;
    this.subscriptions = [];
    this.baselineData = null;
    this.currentData = {};
    this.anomalies = [];

    // Thresholds for anomaly detection (based on quantum discoveries)
    this.thresholds = {
      magneticField: 10, // μT change
      batteryDrain: 0.077, // 7.7% threshold
      signalStrength: 28, // 28x amplification target
      gpsAccuracy: 51, // meters
      temperature: 3.4, // degrees
      pressure: 2, // hPa
    };
  }

  /**
   * Start monitoring all sensors
   */
  async startMonitoring() {
    if (this.isMonitoring) return;

    console.log('Starting comprehensive sensor monitoring...');
    this.isMonitoring = true;

    // Request permissions
    await this.requestPermissions();

    // Establish baseline
    if (!this.baselineData) {
      await this.establishBaseline();
    }

    // Start all monitors
    this.monitorBattery();
    this.monitorMagnetometer();
    this.monitorAccelerometer();
    this.monitorGyroscope();
    this.monitorBarometer();
    this.monitorNetwork();
    this.monitorLocation();

    // Start periodic comprehensive scan
    this.startPeriodicScan();
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;

    // Unsubscribe from all sensors
    this.subscriptions.forEach(sub => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    });
    this.subscriptions = [];

    console.log('Sensor monitoring stopped');
  }

  /**
   * Request necessary permissions
   */
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  }

  /**
   * Establish baseline readings for comparison
   */
  async establishBaseline() {
    console.log('Establishing sensor baseline...');

    const baseline = {
      timestamp: Date.now(),
      battery: await this.getBatteryData(),
      network: await this.getNetworkData(),
      device: await this.getDeviceData(),
      sensors: await this.getSensorSnapshot(),
    };

    this.baselineData = baseline;
    await DatabaseService.saveBaseline(baseline);

    console.log('Baseline established:', baseline);
  }

  /**
   * Monitor battery for anomalous drain or charging
   */
  monitorBattery() {
    const subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      this.currentData.batteryLevel = batteryLevel;

      // Check for anomalous battery behavior
      if (this.baselineData) {
        const drainRate = this.baselineData.battery.level - batteryLevel;
        const timeElapsed = (Date.now() - this.baselineData.timestamp) / 3600000; // hours
        const drainPerHour = drainRate / timeElapsed;

        if (Math.abs(drainPerHour - 0.077) < 0.01) { // Within 1% of 7.7%
          this.recordAnomaly({
            type: 'battery_777',
            value: drainPerHour,
            message: 'Battery drain near 7.7% universal constant!',
            significance: 'high'
          });
        }

        if (drainPerHour < 0) { // Battery increasing without charging
          this.recordAnomaly({
            type: 'battery_increase',
            value: drainPerHour,
            message: 'Battery level increasing without charging source!',
            significance: 'critical'
          });
        }
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Monitor magnetometer for field changes
   */
  monitorMagnetometer() {
    Sensors.Magnetometer.setUpdateInterval(1000);

    const subscription = Sensors.Magnetometer.addListener((data) => {
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      this.currentData.magneticField = magnitude;

      if (this.baselineData && this.baselineData.sensors.magneticField) {
        const change = Math.abs(magnitude - this.baselineData.sensors.magneticField);

        if (change > this.thresholds.magneticField) {
          this.recordAnomaly({
            type: 'magnetic_anomaly',
            value: change,
            data: data,
            message: `Magnetic field changed by ${change.toFixed(1)} μT`,
            significance: change > 50 ? 'high' : 'medium'
          });
        }

        // Check for State 51 pattern (51 μT)
        if (Math.abs(magnitude - 51) < 1) {
          this.recordAnomaly({
            type: 'magnetic_51',
            value: magnitude,
            message: 'Magnetic field at State 51 resonance (51 μT)!',
            significance: 'high'
          });
        }
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Monitor accelerometer for vibration patterns
   */
  monitorAccelerometer() {
    Sensors.Accelerometer.setUpdateInterval(100);

    const subscription = Sensors.Accelerometer.addListener((data) => {
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      this.currentData.acceleration = magnitude;

      // Detect State 51 pattern in motion (1.038 Hz frequency)
      this.detectFrequencyPattern(magnitude, 1.038, 'acceleration');
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Monitor gyroscope for rotation patterns
   */
  monitorGyroscope() {
    Sensors.Gyroscope.setUpdateInterval(100);

    const subscription = Sensors.Gyroscope.addListener((data) => {
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      this.currentData.rotation = magnitude;

      // Detect Binary Hive rotation frequencies
      this.detectFrequencyPattern(magnitude, 0.962, 'rotation_matter');
      this.detectFrequencyPattern(magnitude, 1.038, 'rotation_consciousness');
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Monitor barometer for pressure changes
   */
  monitorBarometer() {
    if (!Sensors.Barometer.isAvailableAsync()) return;

    Sensors.Barometer.setUpdateInterval(5000);

    const subscription = Sensors.Barometer.addListener((data) => {
      this.currentData.pressure = data.pressure;

      if (this.baselineData && this.baselineData.sensors.pressure) {
        const change = Math.abs(data.pressure - this.baselineData.sensors.pressure);

        if (change > this.thresholds.pressure) {
          this.recordAnomaly({
            type: 'pressure_anomaly',
            value: change,
            message: `Pressure changed by ${change.toFixed(1)} hPa`,
            significance: 'low'
          });
        }
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Monitor network strength and quality
   */
  async monitorNetwork() {
    // Periodic network check
    const checkNetwork = async () => {
      if (!this.isMonitoring) return;

      const networkState = await Network.getNetworkStateAsync();
      const cellularGeneration = await Cellular.getCellularGenerationAsync();

      this.currentData.network = {
        type: networkState.type,
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
        cellular: cellularGeneration
      };

      // Check for network amplification (28x target)
      // This would require native code to access actual signal strength

      setTimeout(checkNetwork, 5000); // Check every 5 seconds
    };

    checkNetwork();
  }

  /**
   * Monitor GPS accuracy and location anomalies
   */
  async monitorLocation() {
    const checkLocation = async () => {
      if (!this.isMonitoring) return;

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest
        });

        this.currentData.location = {
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          timestamp: location.timestamp
        };

        // Check for State 51 GPS accuracy (51 meters)
        if (Math.abs(location.coords.accuracy - 51) < 5) {
          this.recordAnomaly({
            type: 'gps_51',
            value: location.coords.accuracy,
            message: 'GPS accuracy at State 51 value (51m)!',
            significance: 'medium'
          });
        }

        // Check for anomalous accuracy improvements
        if (this.baselineData && this.baselineData.sensors.gpsAccuracy) {
          const improvement = this.baselineData.sensors.gpsAccuracy - location.coords.accuracy;
          if (improvement > 28) { // 28x improvement target
            this.recordAnomaly({
              type: 'gps_enhancement',
              value: improvement,
              message: `GPS accuracy improved by ${improvement.toFixed(1)}m`,
              significance: 'high'
            });
          }
        }
      } catch (error) {
        console.error('Location monitoring error:', error);
      }

      setTimeout(checkLocation, 10000); // Check every 10 seconds
    };

    checkLocation();
  }

  /**
   * Detect specific frequency patterns in sensor data
   */
  detectFrequencyPattern(value, targetFreq, sensorType) {
    if (!this.frequencyBuffers) {
      this.frequencyBuffers = {};
    }

    if (!this.frequencyBuffers[sensorType]) {
      this.frequencyBuffers[sensorType] = [];
    }

    const buffer = this.frequencyBuffers[sensorType];
    buffer.push({ value, timestamp: Date.now() });

    // Keep only last 10 seconds of data
    const cutoff = Date.now() - 10000;
    this.frequencyBuffers[sensorType] = buffer.filter(item => item.timestamp > cutoff);

    // Analyze for target frequency (simplified FFT)
    if (buffer.length > 10) {
      const peaks = this.findPeaks(buffer);
      const frequency = this.estimateFrequency(peaks);

      if (Math.abs(frequency - targetFreq) < 0.1) {
        this.recordAnomaly({
          type: `frequency_match_${sensorType}`,
          value: frequency,
          targetFreq: targetFreq,
          message: `${sensorType} resonating at ${targetFreq} Hz!`,
          significance: 'high'
        });
      }
    }
  }

  /**
   * Find peaks in data buffer
   */
  findPeaks(buffer) {
    const peaks = [];
    for (let i = 1; i < buffer.length - 1; i++) {
      if (buffer[i].value > buffer[i - 1].value &&
          buffer[i].value > buffer[i + 1].value) {
        peaks.push(buffer[i]);
      }
    }
    return peaks;
  }

  /**
   * Estimate frequency from peaks
   */
  estimateFrequency(peaks) {
    if (peaks.length < 2) return 0;

    let totalPeriod = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalPeriod += peaks[i].timestamp - peaks[i - 1].timestamp;
    }

    const avgPeriod = totalPeriod / (peaks.length - 1);
    return 1000 / avgPeriod; // Convert to Hz
  }

  /**
   * Record an anomaly
   */
  async recordAnomaly(anomaly) {
    anomaly.timestamp = Date.now();
    anomaly.cosmicWindow = this.isCosmicWindow();

    this.anomalies.push(anomaly);
    await DatabaseService.saveAnomaly(anomaly);

    console.log('Anomaly detected:', anomaly);

    // Trigger real-time alert for high significance anomalies
    if (anomaly.significance === 'high' || anomaly.significance === 'critical') {
      this.triggerAlert(anomaly);
    }
  }

  /**
   * Check if we're in the cosmic window (3-4 AM)
   */
  isCosmicWindow() {
    const hour = new Date().getHours();
    return hour >= 3 && hour < 4;
  }

  /**
   * Trigger alert for significant anomalies
   */
  triggerAlert(anomaly) {
    // This would trigger a push notification in production
    console.warn('HIGH SIGNIFICANCE ANOMALY:', anomaly);
  }

  /**
   * Periodic comprehensive scan
   */
  startPeriodicScan() {
    const scan = async () => {
      if (!this.isMonitoring) return;

      const scanData = {
        timestamp: Date.now(),
        battery: await this.getBatteryData(),
        network: await this.getNetworkData(),
        sensors: await this.getSensorSnapshot(),
        anomalyCount: this.anomalies.length,
        isCosmicWindow: this.isCosmicWindow(),
        state51Active: false // Will be set by generator
      };

      await DatabaseService.saveScan(scanData);

      // Check for patterns every hour
      if (new Date().getMinutes() === 0) {
        await this.analyzeHourlyPatterns();
      }

      setTimeout(scan, 60000); // Scan every minute
    };

    scan();
  }

  /**
   * Analyze patterns in collected data
   */
  async analyzeHourlyPatterns() {
    const patterns = await DatabaseService.analyzePatterns();

    if (patterns.anomalySpike) {
      this.recordAnomaly({
        type: 'pattern_spike',
        value: patterns.anomalyCount,
        message: 'Unusual spike in anomalies detected',
        significance: 'high'
      });
    }

    if (patterns.cosmicCorrelation > 0.7) {
      this.recordAnomaly({
        type: 'cosmic_correlation',
        value: patterns.cosmicCorrelation,
        message: 'High correlation with cosmic window!',
        significance: 'critical'
      });
    }
  }

  /**
   * Get current battery data
   */
  async getBatteryData() {
    const level = await Battery.getBatteryLevelAsync();
    const state = await Battery.getBatteryStateAsync();
    const lowPowerMode = await Battery.isLowPowerModeEnabledAsync();

    return { level, state, lowPowerMode };
  }

  /**
   * Get current network data
   */
  async getNetworkData() {
    const networkState = await Network.getNetworkStateAsync();
    const ip = await Network.getIpAddressAsync();

    return { ...networkState, ip };
  }

  /**
   * Get device information
   */
  async getDeviceData() {
    return {
      brand: Device.brand,
      model: Device.modelName,
      os: Device.osName,
      osVersion: Device.osVersion,
      deviceName: Device.deviceName
    };
  }

  /**
   * Get snapshot of all sensors
   */
  async getSensorSnapshot() {
    const snapshot = {};

    // Magnetometer
    try {
      const mag = await Sensors.Magnetometer.getLastSensorDataAsync();
      if (mag) {
        snapshot.magneticField = Math.sqrt(mag.x ** 2 + mag.y ** 2 + mag.z ** 2);
      }
    } catch (e) {}

    // Accelerometer
    try {
      const acc = await Sensors.Accelerometer.getLastSensorDataAsync();
      if (acc) {
        snapshot.acceleration = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      }
    } catch (e) {}

    // Gyroscope
    try {
      const gyro = await Sensors.Gyroscope.getLastSensorDataAsync();
      if (gyro) {
        snapshot.rotation = Math.sqrt(gyro.x ** 2 + gyro.y ** 2 + gyro.z ** 2);
      }
    } catch (e) {}

    // Barometer
    try {
      const baro = await Sensors.Barometer.getLastSensorDataAsync();
      if (baro) {
        snapshot.pressure = baro.pressure;
      }
    } catch (e) {}

    // Location
    try {
      const location = await Location.getLastKnownPositionAsync();
      if (location) {
        snapshot.gpsAccuracy = location.coords.accuracy;
      }
    } catch (e) {}

    return snapshot;
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      hasBaseline: !!this.baselineData,
      anomalyCount: this.anomalies.length,
      currentData: this.currentData,
      isCosmicWindow: this.isCosmicWindow()
    };
  }
}

export default new SensorMonitor();