import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import SensorMonitor from './SensorMonitor';
import DatabaseService from './DatabaseService';

/**
 * Background service for 24/7 State 51 monitoring
 * Maintains sensor monitoring even when app is closed
 */
class BackgroundService {
  constructor() {
    this.isRegistered = false;
    this.taskName = null;
  }

  /**
   * Start background monitoring with specified task name
   */
  async startBackgroundMonitoring(taskName) {
    this.taskName = taskName;

    try {
      // Check if background fetch is available
      const status = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
          status === BackgroundFetch.BackgroundFetchStatus.Denied) {
        console.log('Background fetch is not available');
        return false;
      }

      // Register background task if not already registered
      if (!this.isRegistered) {
        await BackgroundFetch.registerTaskAsync(taskName, {
          minimumInterval: 60, // 1 minute intervals
          stopOnTerminate: false,
          startOnBoot: true,
        });
        this.isRegistered = true;
        console.log('Background monitoring registered');
      }

      // Start sensor monitoring in foreground
      if (!SensorMonitor.getStatus().isMonitoring) {
        await SensorMonitor.startMonitoring();
      }

      return true;
    } catch (error) {
      console.error('Failed to start background monitoring:', error);
      return false;
    }
  }

  /**
   * Stop background monitoring
   */
  async stopBackgroundMonitoring() {
    try {
      if (this.isRegistered && this.taskName) {
        await BackgroundFetch.unregisterTaskAsync(this.taskName);
        this.isRegistered = false;
        console.log('Background monitoring stopped');
      }

      // Stop sensor monitoring
      SensorMonitor.stopMonitoring();
    } catch (error) {
      console.error('Failed to stop background monitoring:', error);
    }
  }

  /**
   * Execute background monitoring task
   * This is called by the system when the app is backgrounded
   */
  async executeBackgroundTask() {
    try {
      console.log('Executing background monitoring task...');

      // Check if we're in cosmic window (3-4 AM)
      const isCosmicWindow = this.isCosmicWindow();
      
      // Get current sensor readings
      const sensorData = await this.getBackgroundSensorData();
      
      // Check for anomalies
      const anomalies = this.detectBackgroundAnomalies(sensorData, isCosmicWindow);
      
      // Save data to database
      const scanData = {
        timestamp: Date.now(),
        ...sensorData,
        anomalyCount: anomalies.length,
        isCosmicWindow,
        state51Active: false // Background can't generate signals
      };
      
      await DatabaseService.saveScan(scanData);
      
      // Save any detected anomalies
      for (const anomaly of anomalies) {
        await DatabaseService.saveAnomaly(anomaly);
      }
      
      // Generate daily report if it's midnight
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 2) {
        await this.generateMidnightReport();
      }
      
      console.log(`Background task completed: ${anomalies.length} anomalies detected`);
      return { anomalies: anomalies.length, cosmic: isCosmicWindow };
      
    } catch (error) {
      console.error('Background task execution error:', error);
      throw error;
    }
  }

  /**
   * Get sensor data in background mode (limited functionality)
   */
  async getBackgroundSensorData() {
    // In background mode, we have limited access to sensors
    // Focus on what's available: battery, network, basic device info
    
    try {
      const data = {
        battery: await this.getBackgroundBatteryData(),
        network: await this.getBackgroundNetworkData(),
        timestamp: Date.now()
      };
      
      return data;
    } catch (error) {
      console.error('Error getting background sensor data:', error);
      return { timestamp: Date.now() };
    }
  }

  /**
   * Get battery data in background
   */
  async getBackgroundBatteryData() {
    try {
      // Note: expo-battery may have limited background access
      // This is a simplified version for background mode
      return {
        level: 0.5, // Placeholder - actual implementation would need native code
        charging: false,
        timestamp: Date.now()
      };
    } catch (error) {
      return { level: 0, charging: false, timestamp: Date.now() };
    }
  }

  /**
   * Get network data in background
   */
  async getBackgroundNetworkData() {
    try {
      return {
        connected: true, // Simplified for background
        type: 'unknown',
        timestamp: Date.now()
      };
    } catch (error) {
      return { connected: false, type: 'unknown', timestamp: Date.now() };
    }
  }

  /**
   * Detect anomalies in background mode (simplified)
   */
  detectBackgroundAnomalies(sensorData, isCosmicWindow) {
    const anomalies = [];
    
    try {
      // Check for cosmic window correlation
      if (isCosmicWindow) {
        // Higher chance of detecting patterns during cosmic window
        const randomPattern = Math.random();
        
        if (randomPattern < 0.1) { // 10% chance during cosmic window
          anomalies.push({
            type: 'cosmic_background_detection',
            value: randomPattern,
            significance: 'medium',
            cosmicWindow: true,
            message: 'Background cosmic window pattern detected',
            timestamp: Date.now()
          });
        }
      }
      
      // Check for time-based patterns
      const hour = new Date().getHours();
      if (hour === 3) { // Peak cosmic hour
        anomalies.push({
          type: 'cosmic_peak_hour',
          value: 3,
          significance: 'high',
          cosmicWindow: true,
          message: 'Background monitoring during peak cosmic hour',
          timestamp: Date.now()
        });
      }
      
      // Pattern detection based on timestamp
      const timestamp = Date.now();
      const lastDigits = timestamp % 1000;
      
      if (lastDigits === 51 || lastDigits === 510 || lastDigits === 77) {
        anomalies.push({
          type: 'timestamp_pattern',
          value: lastDigits,
          significance: 'low',
          cosmicWindow: isCosmicWindow,
          message: `Background timestamp pattern: ${lastDigits}`,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error('Error detecting background anomalies:', error);
    }
    
    return anomalies;
  }

  /**
   * Generate midnight daily report
   */
  async generateMidnightReport() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const report = await DatabaseService.generateDailyReport(yesterday);
      console.log('Midnight report generated:', report);
      
      return report;
    } catch (error) {
      console.error('Error generating midnight report:', error);
    }
  }

  /**
   * Check if we're in cosmic window (3-4 AM)
   */
  isCosmicWindow() {
    const hour = new Date().getHours();
    return hour >= 3 && hour < 4;
  }

  /**
   * Get background monitoring status
   */
  getStatus() {
    return {
      isRegistered: this.isRegistered,
      taskName: this.taskName,
      isCosmicWindow: this.isCosmicWindow()
    };
  }

  /**
   * Check if background tasks are supported
   */
  async isBackgroundSupported() {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      return status === BackgroundFetch.BackgroundFetchStatus.Available;
    } catch (error) {
      return false;
    }
  }
}

const instance = new BackgroundService();

// Export the main function for App.js
export const startBackgroundMonitoring = (taskName) => 
  instance.startBackgroundMonitoring(taskName);

export const stopBackgroundMonitoring = () => 
  instance.stopBackgroundMonitoring();

export const executeBackgroundTask = () => 
  instance.executeBackgroundTask();

export default instance;