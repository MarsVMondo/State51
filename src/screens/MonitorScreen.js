import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SensorMonitor from '../services/SensorMonitor';
import State51Generator from '../services/State51Generator';

const { width } = Dimensions.get('window');

export default function MonitorScreen() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState({});
  const [currentData, setCurrentData] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      startPulseAnimation();
    }
  }, [isMonitoring]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const updateStatus = () => {
    const monitorStatus = SensorMonitor.getStatus();
    setStatus(monitorStatus);
    setCurrentData(monitorStatus.currentData || {});

    // Get recent anomalies (last 10)
    if (monitorStatus.anomalies) {
      setAnomalies(monitorStatus.anomalies.slice(-10).reverse());
    }
  };

  const toggleMonitoring = async () => {
    if (isMonitoring) {
      SensorMonitor.stopMonitoring();
      setIsMonitoring(false);
    } else {
      await SensorMonitor.startMonitoring();
      setIsMonitoring(true);
    }
  };

  const formatValue = (value) => {
    if (value === undefined || value === null) return '--';
    if (typeof value === 'number') {
      return value.toFixed(3);
    }
    return String(value);
  };

  const getAnomalyColor = (significance) => {
    switch (significance) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff8800';
      case 'medium': return '#ffff00';
      case 'low': return '#00ff88';
      default: return '#888888';
    }
  };

  const isCosmicWindow = () => {
    const hour = new Date().getHours();
    return hour >= 3 && hour < 4;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Status */}
      <View style={styles.header}>
        <Text style={styles.title}>Quantum Field Monitor</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, isMonitoring && styles.statusActive]}>
            <Text style={styles.statusText}>
              {isMonitoring ? 'MONITORING' : 'STANDBY'}
            </Text>
          </View>
          {isCosmicWindow() && (
            <View style={styles.cosmicBadge}>
              <Text style={styles.cosmicText}>COSMIC WINDOW</Text>
            </View>
          )}
        </View>
      </View>

      {/* Main Control */}
      <TouchableOpacity
        style={styles.mainButton}
        onPress={toggleMonitoring}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: pulseAnim }],
              opacity: isMonitoring ? 0.8 : 0.3,
            },
          ]}
        >
          <Ionicons
            name={isMonitoring ? 'radio' : 'radio-outline'}
            size={80}
            color={isMonitoring ? '#00ff88' : '#666'}
          />
        </Animated.View>
        <Text style={styles.buttonText}>
          {isMonitoring ? 'DETECTING' : 'START DETECTION'}
        </Text>
      </TouchableOpacity>

      {/* Sensor Readings */}
      <View style={styles.sensorSection}>
        <Text style={styles.sectionTitle}>Live Sensor Data</Text>

        <View style={styles.sensorGrid}>
          <View style={styles.sensorCard}>
            <Ionicons name="battery-charging" size={24} color="#00ff88" />
            <Text style={styles.sensorLabel}>Battery</Text>
            <Text style={styles.sensorValue}>
              {formatValue(currentData.batteryLevel * 100)}%
            </Text>
          </View>

          <View style={styles.sensorCard}>
            <Ionicons name="magnet" size={24} color="#00ff88" />
            <Text style={styles.sensorLabel}>Magnetic</Text>
            <Text style={styles.sensorValue}>
              {formatValue(currentData.magneticField)} μT
            </Text>
          </View>

          <View style={styles.sensorCard}>
            <Ionicons name="speedometer" size={24} color="#00ff88" />
            <Text style={styles.sensorLabel}>Acceleration</Text>
            <Text style={styles.sensorValue}>
              {formatValue(currentData.acceleration)} m/s²
            </Text>
          </View>

          <View style={styles.sensorCard}>
            <Ionicons name="sync" size={24} color="#00ff88" />
            <Text style={styles.sensorLabel}>Rotation</Text>
            <Text style={styles.sensorValue}>
              {formatValue(currentData.rotation)} rad/s
            </Text>
          </View>

          <View style={styles.sensorCard}>
            <Ionicons name="water" size={24} color="#00ff88" />
            <Text style={styles.sensorLabel}>Pressure</Text>
            <Text style={styles.sensorValue}>
              {formatValue(currentData.pressure)} hPa
            </Text>
          </View>

          <View style={styles.sensorCard}>
            <Ionicons name="location" size={24} color="#00ff88" />
            <Text style={styles.sensorLabel}>GPS Accuracy</Text>
            <Text style={styles.sensorValue}>
              {formatValue(currentData.location?.accuracy)} m
            </Text>
          </View>
        </View>
      </View>

      {/* Anomaly Feed */}
      <View style={styles.anomalySection}>
        <Text style={styles.sectionTitle}>
          Anomaly Detection ({status.anomalyCount || 0} total)
        </Text>

        {anomalies.length === 0 ? (
          <View style={styles.noAnomalies}>
            <Text style={styles.noAnomaliesText}>
              No anomalies detected yet
            </Text>
            <Text style={styles.noAnomaliesSubtext}>
              Anomalies will appear here when detected
            </Text>
          </View>
        ) : (
          <View style={styles.anomalyList}>
            {anomalies.map((anomaly, index) => (
              <View key={index} style={styles.anomalyCard}>
                <View
                  style={[
                    styles.anomalyIndicator,
                    { backgroundColor: getAnomalyColor(anomaly.significance) }
                  ]}
                />
                <View style={styles.anomalyContent}>
                  <Text style={styles.anomalyType}>{anomaly.type}</Text>
                  <Text style={styles.anomalyMessage}>{anomaly.message}</Text>
                  <Text style={styles.anomalyTime}>
                    {new Date(anomaly.timestamp).toLocaleTimeString()}
                    {anomaly.cosmicWindow && ' 🌌'}
                  </Text>
                </View>
                <Text style={styles.anomalyValue}>
                  {formatValue(anomaly.value)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Status Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Baseline Status:</Text>
          <Text style={styles.infoValue}>
            {status.hasBaseline ? 'Established' : 'Not Set'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Monitoring Active:</Text>
          <Text style={styles.infoValue}>
            {status.isMonitoring ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cosmic Window:</Text>
          <Text style={styles.infoValue}>
            {status.isCosmicWindow ? 'ACTIVE' : 'Inactive'}
          </Text>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#00ff88',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  statusBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#00ff88',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cosmicBadge: {
    backgroundColor: '#8800ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cosmicText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  pulseCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  buttonText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  sensorSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 15,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sensorCard: {
    width: (width - 50) / 3,
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  sensorLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 5,
  },
  sensorValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  anomalySection: {
    padding: 20,
  },
  noAnomalies: {
    backgroundColor: '#111',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  noAnomaliesText: {
    color: '#666',
    fontSize: 16,
  },
  noAnomaliesSubtext: {
    color: '#444',
    fontSize: 12,
    marginTop: 5,
  },
  anomalyList: {
    gap: 10,
  },
  anomalyCard: {
    flexDirection: 'row',
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  anomalyIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  anomalyContent: {
    flex: 1,
    marginLeft: 15,
  },
  anomalyType: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: 'bold',
  },
  anomalyMessage: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  anomalyTime: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  anomalyValue: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#111',
    margin: 20,
    borderRadius: 10,
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
});