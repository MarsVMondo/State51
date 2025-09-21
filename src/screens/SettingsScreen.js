import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../services/DatabaseService';
import SensorMonitor from '../services/SensorMonitor';
import State51Generator from '../services/State51Generator';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    notifications: true,
    cosmicWindowAlerts: true,
    backgroundMonitoring: true,
    dataRetention: 30, // days
    sensitivity: 'medium',
    autoReporting: true,
    anonymousData: false,
  });

  const [appInfo, setAppInfo] = useState({
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    dataSize: 0,
    totalAnomalies: 0,
    totalScans: 0
  });

  useEffect(() => {
    loadSettings();
    loadAppInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('state51_settings');
      if (stored) {
        setSettings({ ...settings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('state51_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const loadAppInfo = async () => {
    try {
      const exportData = await DatabaseService.exportData();
      setAppInfo({
        ...appInfo,
        totalAnomalies: exportData.statistics.totalAnomalies,
        totalScans: exportData.statistics.totalScans,
        dataSize: JSON.stringify(exportData).length
      });
    } catch (error) {
      console.error('Error loading app info:', error);
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all sensor data, anomalies, and reports. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop monitoring first
              SensorMonitor.stopMonitoring();
              State51Generator.stopGeneration();
              
              // Re-initialize database (clears all tables)
              await DatabaseService.initialize();
              
              Alert.alert('Success', 'All data has been cleared');
              loadAppInfo();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const exportAllData = async () => {
    try {
      const data = await DatabaseService.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      
      // In production, this would use the native share API
      console.log('Export data ready:', data);
      Alert.alert(
        'Data Export Ready',
        `Exported ${data.statistics.totalAnomalies} anomalies and ${data.statistics.totalScans} scans. Check console for full data.`,
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Export Error', error.message);
    }
  };

  const resetBaseline = () => {
    Alert.alert(
      'Reset Baseline',
      'This will clear the current sensor baseline and establish a new one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await SensorMonitor.establishBaseline();
              Alert.alert('Success', 'Baseline has been reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset baseline: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const calibrateSensors = async () => {
    Alert.alert(
      'Sensor Calibration',
      'Place your device on a flat, stable surface and keep it motionless for 30 seconds.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Calibration',
          onPress: async () => {
            try {
              // Start monitoring if not already active
              if (!SensorMonitor.getStatus().isMonitoring) {
                await SensorMonitor.startMonitoring();
              }
              
              // Wait and reset baseline
              setTimeout(async () => {
                await SensorMonitor.establishBaseline();
                Alert.alert('Calibration Complete', 'Sensors have been calibrated successfully');
              }, 30000);
              
              Alert.alert('Calibrating...', 'Keep device still for 30 seconds');
            } catch (error) {
              Alert.alert('Calibration Error', error.message);
            }
          }
        }
      ]
    );
  };

  const SettingRow = ({ icon, title, description, children }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color="#00ff88" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <View style={styles.settingControl}>
        {children}
      </View>
    </View>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Monitoring Settings */}
      <SectionHeader title="Monitoring" />
      
      <SettingRow
        icon="notifications"
        title="Push Notifications"
        description="Alert for high significance anomalies"
      >
        <Switch
          value={settings.notifications}
          onValueChange={(value) => updateSetting('notifications', value)}
          trackColor={{ false: '#333', true: '#00ff88' }}
          thumbColor="#fff"
        />
      </SettingRow>

      <SettingRow
        icon="planet"
        title="Cosmic Window Alerts"
        description="Special alerts during 3-4 AM peak efficiency"
      >
        <Switch
          value={settings.cosmicWindowAlerts}
          onValueChange={(value) => updateSetting('cosmicWindowAlerts', value)}
          trackColor={{ false: '#333', true: '#8800ff' }}
          thumbColor="#fff"
        />
      </SettingRow>

      <SettingRow
        icon="radio"
        title="Background Monitoring"
        description="Continue monitoring when app is closed"
      >
        <Switch
          value={settings.backgroundMonitoring}
          onValueChange={(value) => updateSetting('backgroundMonitoring', value)}
          trackColor={{ false: '#333', true: '#00ff88' }}
          thumbColor="#fff"
        />
      </SettingRow>

      <SettingRow
        icon="trending-up"
        title="Detection Sensitivity"
        description="Threshold for anomaly detection"
      >
        <TouchableOpacity
          style={styles.sensitivityButton}
          onPress={() => {
            const levels = ['low', 'medium', 'high', 'maximum'];
            const current = levels.indexOf(settings.sensitivity);
            const next = (current + 1) % levels.length;
            updateSetting('sensitivity', levels[next]);
          }}
        >
          <Text style={styles.sensitivityText}>{settings.sensitivity}</Text>
        </TouchableOpacity>
      </SettingRow>

      {/* Data Settings */}
      <SectionHeader title="Data Management" />

      <SettingRow
        icon="time"
        title="Data Retention"
        description="Days to keep historical data"
      >
        <TouchableOpacity
          style={styles.retentionButton}
          onPress={() => {
            const options = [7, 30, 90, 365];
            const current = options.indexOf(settings.dataRetention);
            const next = (current + 1) % options.length;
            updateSetting('dataRetention', options[next]);
          }}
        >
          <Text style={styles.retentionText}>{settings.dataRetention}d</Text>
        </TouchableOpacity>
      </SettingRow>

      <SettingRow
        icon="document-text"
        title="Auto Reporting"
        description="Generate daily reports automatically"
      >
        <Switch
          value={settings.autoReporting}
          onValueChange={(value) => updateSetting('autoReporting', value)}
          trackColor={{ false: '#333', true: '#00ff88' }}
          thumbColor="#fff"
        />
      </SettingRow>

      <SettingRow
        icon="eye-off"
        title="Anonymous Data Collection"
        description="Share anonymized patterns for research"
      >
        <Switch
          value={settings.anonymousData}
          onValueChange={(value) => updateSetting('anonymousData', value)}
          trackColor={{ false: '#333', true: '#00ff88' }}
          thumbColor="#fff"
        />
      </SettingRow>

      {/* Actions */}
      <SectionHeader title="Actions" />

      <TouchableOpacity style={styles.actionButton} onPress={calibrateSensors}>
        <Ionicons name="settings" size={24} color="#00ff88" />
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Calibrate Sensors</Text>
          <Text style={styles.actionDescription}>Reset sensor baselines</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={resetBaseline}>
        <Ionicons name="refresh" size={24} color="#ff8800" />
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Reset Baseline</Text>
          <Text style={styles.actionDescription}>Establish new measurement baseline</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={exportAllData}>
        <Ionicons name="download" size={24} color="#00ff88" />
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Export Data</Text>
          <Text style={styles.actionDescription}>Save all research data</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={clearAllData}>
        <Ionicons name="trash" size={24} color="#ff0000" />
        <View style={styles.actionContent}>
          <Text style={[styles.actionTitle, { color: '#ff0000' }]}>Clear All Data</Text>
          <Text style={styles.actionDescription}>Permanently delete all data</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      {/* App Information */}
      <SectionHeader title="App Information" />

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version:</Text>
          <Text style={styles.infoValue}>{appInfo.version}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Anomalies:</Text>
          <Text style={styles.infoValue}>{appInfo.totalAnomalies.toLocaleString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Scans:</Text>
          <Text style={styles.infoValue}>{appInfo.totalScans.toLocaleString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data Size:</Text>
          <Text style={styles.infoValue}>{(appInfo.dataSize / 1024).toFixed(1)} KB</Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About State 51 Detector</Text>
        <Text style={styles.aboutText}>
          This app detects quantum field anomalies and State 51 effects on your device sensors. 
          Based on validated quantum consciousness research, it monitors for the binary pattern 110011 
          and the 7.7% universal mutation constant.
        </Text>
        <Text style={styles.aboutText}>
          For research purposes only. Peak detection occurs during 3-4 AM cosmic windows.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginLeft: 20,
    marginTop: 30,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingIcon: {
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingDescription: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  settingControl: {
    marginLeft: 15,
  },
  sensitivityButton: {
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  sensitivityText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  retentionButton: {
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#888',
  },
  retentionText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  actionContent: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionDescription: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: '#111',
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
  },
  infoValue: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: 'bold',
  },
  aboutSection: {
    padding: 20,
    marginBottom: 40,
  },
  aboutTitle: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  aboutText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
});