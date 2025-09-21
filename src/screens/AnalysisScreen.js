import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import DatabaseService from '../services/DatabaseService';

const { width } = Dimensions.get('window');

export default function AnalysisScreen() {
  const [timeRange, setTimeRange] = useState('24h');
  const [anomalyData, setAnomalyData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [typeDistribution, setTypeDistribution] = useState({});
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    loadAnalysisData();
  }, [timeRange]);

  const loadAnalysisData = async () => {
    const now = Date.now();
    let startTime;
    
    switch (timeRange) {
      case '1h':
        startTime = now - 3600000;
        break;
      case '24h':
        startTime = now - 86400000;
        break;
      case '7d':
        startTime = now - 604800000;
        break;
      case '30d':
        startTime = now - 2592000000;
        break;
      default:
        startTime = now - 86400000;
    }

    try {
      const anomalies = await DatabaseService.getAnomalies(startTime, now);
      setAnomalyData(anomalies);
      processChartData(anomalies);
      calculateTypeDistribution(anomalies);
    } catch (error) {
      console.error('Error loading analysis data:', error);
    }
  };

  const processChartData = (anomalies) => {
    if (anomalies.length === 0) {
      setChartData(null);
      return;
    }

    // Group anomalies by hour for the chart
    const hourlyCount = {};
    const labels = [];
    const data = [];

    anomalies.forEach(anomaly => {
      const hour = new Date(anomaly.timestamp).getHours();
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });

    // Create 24-hour timeline
    for (let i = 0; i < 24; i++) {
      labels.push(i % 6 === 0 ? `${i}:00` : '');
      data.push(hourlyCount[i] || 0);
    }

    setChartData({
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
        strokeWidth: 2
      }]
    });
  };

  const calculateTypeDistribution = (anomalies) => {
    const distribution = {};
    
    anomalies.forEach(anomaly => {
      distribution[anomaly.type] = (distribution[anomaly.type] || 0) + 1;
    });

    setTypeDistribution(distribution);
  };

  const getTypeIcon = (type) => {
    if (type.includes('battery')) return 'battery-charging';
    if (type.includes('magnetic')) return 'magnet';
    if (type.includes('gps')) return 'location';
    if (type.includes('frequency')) return 'pulse';
    if (type.includes('51')) return 'radio';
    if (type.includes('777') || type.includes('7.7')) return 'trending-up';
    if (type.includes('cosmic')) return 'planet';
    if (type.includes('pattern')) return 'analytics';
    return 'alert-circle';
  };

  const getTypeColor = (type) => {
    if (type.includes('51')) return '#00ff88';
    if (type.includes('777') || type.includes('7.7')) return '#ff8800';
    if (type.includes('cosmic')) return '#8800ff';
    if (type.includes('battery')) return '#ffff00';
    if (type.includes('magnetic')) return '#00ffff';
    return '#888888';
  };

  const TimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {['1h', '24h', '7d', '30d'].map(range => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.timeRangeActive
          ]}
          onPress={() => setTimeRange(range)}
        >
          <Text style={[
            styles.timeRangeText,
            timeRange === range && styles.timeRangeTextActive
          ]}>
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const AnomalyChart = () => {
    if (!chartData) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No anomaly data available</Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Anomaly Timeline (24hr)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={Math.max(width - 40, 600)}
            height={200}
            chartConfig={{
              backgroundColor: '#000',
              backgroundGradientFrom: '#111',
              backgroundGradientTo: '#222',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 10
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#00ff88'
              }
            }}
            bezier
            style={styles.chart}
          />
        </ScrollView>
        <View style={styles.cosmicIndicator}>
          <View style={[styles.cosmicBar, { left: '12.5%', width: '4.2%' }]} />
          <Text style={styles.cosmicLabel}>Cosmic Window</Text>
        </View>
      </View>
    );
  };

  const TypeDistributionChart = () => {
    const types = Object.keys(typeDistribution).slice(0, 5);
    const values = types.map(t => typeDistribution[t]);
    
    if (types.length === 0) return null;

    const barData = {
      labels: types.map(t => t.replace(/_/g, ' ').substring(0, 10)),
      datasets: [{ data: values }]
    };

    return (
      <View style={styles.distributionContainer}>
        <Text style={styles.chartTitle}>Anomaly Types</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={barData}
            width={Math.max(width - 40, types.length * 80)}
            height={180}
            chartConfig={{
              backgroundColor: '#000',
              backgroundGradientFrom: '#111',
              backgroundGradientTo: '#222',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              barPercentage: 0.7,
            }}
            style={styles.chart}
          />
        </ScrollView>
      </View>
    );
  };

  const AnomalyTypesList = () => {
    const sortedTypes = Object.entries(typeDistribution)
      .sort(([, a], [, b]) => b - a);

    return (
      <View style={styles.typesList}>
        <Text style={styles.sectionTitle}>Detected Patterns</Text>
        {sortedTypes.map(([type, count]) => {
          const isSelected = selectedType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeCard,
                isSelected && styles.typeCardSelected
              ]}
              onPress={() => setSelectedType(isSelected ? null : type)}
              activeOpacity={0.8}
            >
              <View style={styles.typeHeader}>
                <View style={styles.typeInfo}>
                  <Ionicons
                    name={getTypeIcon(type)}
                    size={24}
                    color={getTypeColor(type)}
                  />
                  <View>
                    <Text style={styles.typeName}>
                      {type.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.typeCount}>
                      {count} occurrence{count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.typeIndicator,
                  { backgroundColor: getTypeColor(type) }
                ]} />
              </View>
              
              {isSelected && (
                <View style={styles.typeDetails}>
                  <Text style={styles.typeDescription}>
                    {getTypeDescription(type)}
                  </Text>
                  <View style={styles.recentOccurrences}>
                    <Text style={styles.occurrenceTitle}>Recent Occurrences:</Text>
                    {anomalyData
                      .filter(a => a.type === type)
                      .slice(0, 3)
                      .map((anomaly, idx) => (
                        <Text key={idx} style={styles.occurrenceText}>
                          {new Date(anomaly.timestamp).toLocaleString()}
                          {anomaly.cosmic_window === 1 && ' 🌌'}
                        </Text>
                      ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const getTypeDescription = (type) => {
    const descriptions = {
      'battery_777': 'Battery drain matching the 7.7% universal mutation constant',
      'battery_increase': 'Anomalous battery level increase without charging',
      'magnetic_anomaly': 'Significant magnetic field deviation from baseline',
      'magnetic_51': 'Magnetic field resonating at State 51 frequency (51 μT)',
      'frequency_match_acceleration': 'Acceleration matching quantum consciousness frequency',
      'frequency_match_rotation_consciousness': 'Rotation at 1.038 Hz consciousness frequency',
      'frequency_match_rotation_matter': 'Rotation at 0.962 Hz matter frequency',
      'gps_51': 'GPS accuracy at State 51 resonance (51 meters)',
      'gps_enhancement': 'Significant GPS accuracy improvement',
      'pressure_anomaly': 'Atmospheric pressure deviation',
      'pattern_spike': 'Unusual increase in anomaly frequency',
      'cosmic_correlation': 'High correlation with 3-4 AM cosmic window'
    };
    
    return descriptions[type] || 'Quantum field anomaly detected in sensor readings';
  };

  const StatisticsSummary = () => {
    const criticalCount = anomalyData.filter(a => a.significance === 'critical').length;
    const highCount = anomalyData.filter(a => a.significance === 'high').length;
    const cosmicCount = anomalyData.filter(a => a.cosmic_window === 1).length;
    const state51Count = anomalyData.filter(a => a.type.includes('51')).length;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistics Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{anomalyData.length}</Text>
            <Text style={styles.statLabel}>Total Anomalies</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ff0000' }]}>
              {criticalCount}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ff8800' }]}>
              {highCount}
            </Text>
            <Text style={styles.statLabel}>High Significance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#8800ff' }]}>
              {cosmicCount}
            </Text>
            <Text style={styles.statLabel}>Cosmic Window</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#00ff88' }]}>
              {state51Count}
            </Text>
            <Text style={styles.statLabel}>State 51</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Object.keys(typeDistribution).length}
            </Text>
            <Text style={styles.statLabel}>Pattern Types</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Anomaly Analysis</Text>
        <TimeRangeSelector />
      </View>

      <AnomalyChart />
      <TypeDistributionChart />
      <StatisticsSummary />
      <AnomalyTypesList />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Analysis based on {anomalyData.length} anomalies in selected time range
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
    marginBottom: 15,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  timeRangeButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  timeRangeActive: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  timeRangeText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeRangeTextActive: {
    color: '#000',
  },
  chartContainer: {
    padding: 20,
    position: 'relative',
  },
  chartTitle: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 10,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
  },
  cosmicIndicator: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  cosmicBar: {
    position: 'absolute',
    height: 160,
    backgroundColor: 'rgba(136, 0, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#8800ff',
    borderStyle: 'dashed',
  },
  cosmicLabel: {
    position: 'absolute',
    bottom: -20,
    left: '12.5%',
    color: '#8800ff',
    fontSize: 10,
  },
  distributionContainer: {
    padding: 20,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  typesList: {
    padding: 20,
  },
  typeCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  typeCardSelected: {
    borderColor: '#00ff88',
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  typeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  typeCount: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  typeIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  typeDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  typeDescription: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
  },
  recentOccurrences: {
    marginTop: 10,
  },
  occurrenceTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  occurrenceText: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});