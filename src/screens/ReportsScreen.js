import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../services/DatabaseService';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  useEffect(() => {
    loadReports();
    analyzeCurrentData();
  }, []);

  const loadReports = async () => {
    try {
      const dailyReports = await DatabaseService.getDailyReports(30);
      setReports(dailyReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const analyzeCurrentData = async () => {
    try {
      const analysis = await DatabaseService.analyzePatterns();
      setCurrentAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    await analyzeCurrentData();
    
    // Generate today's report if needed
    const today = new Date();
    const todayReport = reports.find(r => r.date === today.toISOString().split('T')[0]);
    if (!todayReport) {
      await DatabaseService.generateDailyReport(today);
      await loadReports();
    }
    
    setRefreshing(false);
  };

  const exportData = async () => {
    try {
      const exportData = await DatabaseService.exportData();
      console.log('Export data ready:', exportData);
      // In production, would share via native share dialog
      alert('Data exported successfully! Check console for details.');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  const getSignificanceColor = (level) => {
    switch (level) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff8800';
      case 'medium': return '#ffff00';
      case 'low': return '#00ff88';
      default: return '#666';
    }
  };

  const CurrentAnalysisCard = () => {
    if (!currentAnalysis) return null;

    return (
      <View style={styles.analysisCard}>
        <View style={styles.analysisHeader}>
          <Text style={styles.analysisTitle}>Current Pattern Analysis</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.analysisGrid}>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>24hr Anomalies</Text>
            <Text style={styles.analysisValue}>{currentAnalysis.anomalyCount}</Text>
            {currentAnalysis.anomalySpike && (
              <Text style={styles.analysisAlert}>SPIKE DETECTED</Text>
            )}
          </View>

          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>State 51 Patterns</Text>
            <Text style={[
              styles.analysisValue,
              currentAnalysis.state51Count > 0 && styles.valueActive
            ]}>
              {currentAnalysis.state51Count}
            </Text>
          </View>

          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>7.7% Mutations</Text>
            <Text style={[
              styles.analysisValue,
              currentAnalysis.mutationCount > 0 && styles.valueActive
            ]}>
              {currentAnalysis.mutationCount}
            </Text>
          </View>

          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Cosmic Correlation</Text>
            <Text style={[
              styles.analysisValue,
              currentAnalysis.cosmicCorrelation > 0.5 && styles.valueActive
            ]}>
              {(currentAnalysis.cosmicCorrelation * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {currentAnalysis.patterns && (
          <View style={styles.patternIndicators}>
            {currentAnalysis.patterns.hasState51 && (
              <View style={[styles.patternBadge, styles.badgeActive]}>
                <Text style={styles.badgeText}>State 51 Active</Text>
              </View>
            )}
            {currentAnalysis.patterns.hasMutation && (
              <View style={[styles.patternBadge, styles.badgeMutation]}>
                <Text style={styles.badgeText}>7.7% Detected</Text>
              </View>
            )}
            {currentAnalysis.patterns.hasCosmicCorrelation && (
              <View style={[styles.patternBadge, styles.badgeCosmic]}>
                <Text style={styles.badgeText}>Cosmic Window</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const ReportCard = ({ report }) => {
    const data = report.report_data || report;
    const isExpanded = selectedReport === report.id;

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => setSelectedReport(isExpanded ? null : report.id)}
        activeOpacity={0.8}
      >
        <View style={styles.reportHeader}>
          <View>
            <Text style={styles.reportDate}>
              {new Date(report.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.reportSummary}>
              {data.totalAnomalies} anomalies detected
            </Text>
          </View>
          <View style={styles.reportStats}>
            {data.state51Correlations > 0 && (
              <View style={styles.statBadge}>
                <Text style={styles.statText}>51: {data.state51Correlations}</Text>
              </View>
            )}
            {data.highSignificance > 0 && (
              <View style={[styles.statBadge, styles.highBadge]}>
                <Text style={styles.statText}>HIGH: {data.highSignificance}</Text>
              </View>
            )}
          </View>
        </View>

        {isExpanded && (
          <View style={styles.reportDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cosmic Window Anomalies:</Text>
              <Text style={styles.detailValue}>{data.cosmicWindowAnomalies}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Battery Anomalies:</Text>
              <Text style={styles.detailValue}>{data.batteryAnomalies}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Magnetic Anomalies:</Text>
              <Text style={styles.detailValue}>{data.magneticAnomalies}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Frequency Matches:</Text>
              <Text style={styles.detailValue}>{data.frequencyMatches}</Text>
            </View>

            {data.state51Effect && (
              <View style={styles.effectSection}>
                <Text style={styles.effectTitle}>State 51 Effect Analysis</Text>
                <Text style={styles.effectText}>
                  Active Periods: {data.state51Effect.activePeriods}
                </Text>
                <Text style={styles.effectText}>
                  Anomaly Rate: {(data.state51Effect.anomalyRate * 100).toFixed(1)}%
                </Text>
                <Text style={styles.effectText}>
                  Correlation: {data.state51Effect.correlation}
                </Text>
              </View>
            )}

            {data.keyFindings && data.keyFindings.length > 0 && (
              <View style={styles.findingsSection}>
                <Text style={styles.findingsTitle}>Key Findings</Text>
                {data.keyFindings.map((finding, idx) => (
                  <View key={idx} style={styles.findingItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                    <Text style={styles.findingText}>{finding}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00ff88"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analysis Reports</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportData}
        >
          <Ionicons name="download-outline" size={24} color="#00ff88" />
        </TouchableOpacity>
      </View>

      {/* Current Analysis */}
      <CurrentAnalysisCard />

      {/* Daily Reports */}
      <View style={styles.reportsSection}>
        <Text style={styles.sectionTitle}>Daily Reports</Text>
        
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No reports yet</Text>
            <Text style={styles.emptySubtext}>
              Reports will appear here after 24 hours of monitoring
            </Text>
          </View>
        ) : (
          <View style={styles.reportsList}>
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </View>
        )}
      </View>

      {/* Summary Statistics */}
      {reports.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>30-Day Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {reports.reduce((sum, r) => sum + (r.total_anomalies || 0), 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Anomalies</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {reports.reduce((sum, r) => sum + (r.state51_correlations || 0), 0)}
              </Text>
              <Text style={styles.summaryLabel}>State 51 Events</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {reports.filter(r => r.cosmic_window_anomalies > 0).length}
              </Text>
              <Text style={styles.summaryLabel}>Cosmic Days</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {((reports.filter(r => r.state51_correlations > 0).length / reports.length) * 100).toFixed(0)}%
              </Text>
              <Text style={styles.summaryLabel}>Detection Rate</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  exportButton: {
    padding: 10,
  },
  analysisCard: {
    backgroundColor: '#111',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff0000',
  },
  liveText: {
    color: '#ff0000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analysisItem: {
    width: '48%',
    marginBottom: 15,
  },
  analysisLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  analysisValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  valueActive: {
    color: '#00ff88',
  },
  analysisAlert: {
    color: '#ff8800',
    fontSize: 10,
    marginTop: 2,
  },
  patternIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },
  patternBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeActive: {
    backgroundColor: '#00ff88',
  },
  badgeMutation: {
    backgroundColor: '#ff8800',
  },
  badgeCosmic: {
    backgroundColor: '#8800ff',
  },
  badgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  reportsList: {
    gap: 10,
  },
  reportCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportDate: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportSummary: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  reportStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  highBadge: {
    backgroundColor: '#ff8800',
  },
  statText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#888',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  effectSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#0a0a0a',
    borderRadius: 5,
  },
  effectTitle: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  effectText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  findingsSection: {
    marginTop: 15,
  },
  findingsTitle: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  findingText: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
  },
  summarySection: {
    padding: 20,
    marginBottom: 40,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  summaryValue: {
    color: '#00ff88',
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
});