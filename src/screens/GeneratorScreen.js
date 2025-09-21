import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import State51Generator from '../services/State51Generator';
import SensorMonitor from '../services/SensorMonitor';

export default function GeneratorScreen() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [settings, setSettings] = useState({
    audio: true,
    visual: false,
    haptic: true,
    electromagnetic: true,
  });

  useEffect(() => {
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    setMetrics(State51Generator.getGenerationMetrics());
  };

  const toggleGeneration = async () => {
    if (isGenerating) {
      await State51Generator.stopGeneration();
      setIsGenerating(false);
    } else {
      // Start monitoring if not already running
      if (!SensorMonitor.getStatus().isMonitoring) {
        await SensorMonitor.startMonitoring();
      }

      await State51Generator.startGeneration();
      setIsGenerating(true);

      Alert.alert(
        'State 51 Active',
        'Generating quantum resonance pattern 110011. Monitor sensors for anomalies.',
        [{ text: 'OK' }]
      );
    }
  };

  const PatternVisualization = () => {
    const pattern = [1, 1, 0, 0, 1, 1];
    return (
      <View style={styles.patternContainer}>
        {pattern.map((bit, index) => (
          <View
            key={index}
            style={[
              styles.patternBit,
              bit === 1 ? styles.bitOn : styles.bitOff,
              isGenerating && bit === 1 && styles.bitActive
            ]}
          >
            <Text style={styles.bitText}>{bit}</Text>
          </View>
        ))}
      </View>
    );
  };

  const TimingIndicator = () => {
    const timing = metrics.optimalTiming || {};
    const efficiency = (timing.efficiency || 0) * 100;

    return (
      <View style={[
        styles.timingCard,
        timing.isOptimal && styles.timingOptimal
      ]}>
        <Text style={styles.timingTitle}>Current Timing Window</Text>
        <Text style={styles.timingMode}>{timing.mode || 'Standard'}</Text>
        <View style={styles.efficiencyBar}>
          <View
            style={[
              styles.efficiencyFill,
              { width: `${efficiency}%` }
            ]}
          />
        </View>
        <Text style={styles.efficiencyText}>
          {efficiency.toFixed(0)}% Efficiency
        </Text>
        <Text style={styles.timingMessage}>
          {timing.message || 'Standard efficiency period'}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>State 51 Signal Generator</Text>
        <Text style={styles.subtitle}>Binary Pattern: 110011</Text>
      </View>

      {/* Pattern Visualization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quantum Pattern</Text>
        <PatternVisualization />
        <Text style={styles.patternInfo}>
          Decimal: {metrics.decimalValue || 51} | Frequency: {metrics.frequencies?.consciousness || 1.038} Hz
        </Text>
      </View>

      {/* Main Control */}
      <TouchableOpacity
        style={[
          styles.generateButton,
          isGenerating && styles.generateButtonActive
        ]}
        onPress={toggleGeneration}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isGenerating ? 'stop-circle' : 'play-circle'}
          size={50}
          color="#000"
        />
        <Text style={styles.generateButtonText}>
          {isGenerating ? 'STOP GENERATION' : 'START GENERATION'}
        </Text>
      </TouchableOpacity>

      {/* Timing Indicator */}
      <TimingIndicator />

      {/* Generation Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generation Methods</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-high" size={24} color="#00ff88" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Audio Signal</Text>
              <Text style={styles.settingDescription}>
                1.038 Hz consciousness frequency
              </Text>
            </View>
          </View>
          <Switch
            value={settings.audio}
            onValueChange={(value) => setSettings({...settings, audio: value})}
            trackColor={{ false: '#333', true: '#00ff88' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="sunny" size={24} color="#00ff88" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Visual Flashing</Text>
              <Text style={styles.settingDescription}>
                Screen brightness modulation
              </Text>
            </View>
          </View>
          <Switch
            value={settings.visual}
            onValueChange={(value) => setSettings({...settings, visual: value})}
            trackColor={{ false: '#333', true: '#00ff88' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="hand-left" size={24} color="#00ff88" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Vibration pattern matching
              </Text>
            </View>
          </View>
          <Switch
            value={settings.haptic}
            onValueChange={(value) => setSettings({...settings, haptic: value})}
            trackColor={{ false: '#333', true: '#00ff88' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="radio" size={24} color="#00ff88" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>EM Pattern</Text>
              <Text style={styles.settingDescription}>
                WiFi/Bluetooth modulation
              </Text>
            </View>
          </View>
          <Switch
            value={settings.electromagnetic}
            onValueChange={(value) => setSettings({...settings, electromagnetic: value})}
            trackColor={{ false: '#333', true: '#00ff88' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Frequency Information */}
      <View style={styles.frequencySection}>
        <Text style={styles.sectionTitle}>Quantum Frequencies</Text>

        <View style={styles.frequencyCard}>
          <Text style={styles.frequencyLabel}>Consciousness</Text>
          <Text style={styles.frequencyValue}>1.038 Hz</Text>
          <Text style={styles.frequencyDescription}>Binary Hive rotation</Text>
        </View>

        <View style={styles.frequencyCard}>
          <Text style={styles.frequencyLabel}>Matter</Text>
          <Text style={styles.frequencyValue}>0.962 Hz</Text>
          <Text style={styles.frequencyDescription}>Physical manifestation</Text>
        </View>

        <View style={styles.frequencyCard}>
          <Text style={styles.frequencyLabel}>Beat Frequency</Text>
          <Text style={styles.frequencyValue}>0.076 Hz</Text>
          <Text style={styles.frequencyDescription}>13.2 second period</Text>
        </View>

        <View style={styles.frequencyCard}>
          <Text style={styles.frequencyLabel}>Universal Constant</Text>
          <Text style={styles.frequencyValue}>7.7%</Text>
          <Text style={styles.frequencyDescription}>Mutation rate (1/13)</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How It Works</Text>
        <Text style={styles.instructionsText}>
          State 51 generates the binary pattern 110011 across multiple phone systems simultaneously:
        </Text>
        <Text style={styles.instructionItem}>
          • Audio: Plays consciousness frequency tones
        </Text>
        <Text style={styles.instructionItem}>
          • Visual: Flashes screen in pattern sequence
        </Text>
        <Text style={styles.instructionItem}>
          • Haptic: Vibrates in State 51 rhythm
        </Text>
        <Text style={styles.instructionItem}>
          • EM: Modulates wireless signals
        </Text>
        <Text style={styles.instructionsText}>
          Monitor the Live Monitor tab for any anomalous effects on your device sensors.
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 15,
  },
  patternContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 20,
  },
  patternBit: {
    width: 45,
    height: 45,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  bitOn: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  bitOff: {
    backgroundColor: '#111',
    borderColor: '#333',
  },
  bitActive: {
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  bitText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  patternInfo: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#00ff88',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  generateButtonActive: {
    backgroundColor: '#ff4444',
  },
  generateButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timingCard: {
    backgroundColor: '#111',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  timingOptimal: {
    borderColor: '#00ff88',
    backgroundColor: '#001122',
  },
  timingTitle: {
    color: '#888',
    fontSize: 12,
  },
  timingMode: {
    color: '#00ff88',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  efficiencyBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginVertical: 10,
  },
  efficiencyFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 4,
  },
  efficiencyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timingMessage: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingDescription: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  frequencySection: {
    padding: 20,
  },
  frequencyCard: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frequencyLabel: {
    color: '#888',
    fontSize: 14,
  },
  frequencyValue: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
  },
  frequencyDescription: {
    color: '#666',
    fontSize: 11,
  },
  instructions: {
    padding: 20,
    backgroundColor: '#111',
    margin: 20,
    borderRadius: 10,
  },
  instructionsTitle: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionsText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  instructionItem: {
    color: '#666',
    fontSize: 13,
    marginLeft: 10,
    marginBottom: 5,
  },
});