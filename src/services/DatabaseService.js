import * as SQLite from 'expo-sqlite';

/**
 * Database service for storing and analyzing State 51 detection data
 */
class DatabaseService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database and create tables
   */
  async initialize() {
    this.db = SQLite.openDatabase('state51_detector.db');

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Baselines table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS baselines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            data TEXT NOT NULL
          );
        `);

        // Anomalies table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            type TEXT NOT NULL,
            value REAL,
            significance TEXT,
            cosmic_window INTEGER,
            message TEXT,
            data TEXT
          );
        `);

        // Scans table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            battery_level REAL,
            magnetic_field REAL,
            acceleration REAL,
            rotation REAL,
            pressure REAL,
            gps_accuracy REAL,
            network_type TEXT,
            anomaly_count INTEGER,
            cosmic_window INTEGER,
            state51_active INTEGER,
            data TEXT
          );
        `);

        // Daily reports table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS daily_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            total_anomalies INTEGER,
            high_significance_count INTEGER,
            cosmic_window_anomalies INTEGER,
            state51_correlations INTEGER,
            battery_anomalies INTEGER,
            magnetic_anomalies INTEGER,
            frequency_matches INTEGER,
            report_data TEXT
          );
        `);

        // Experiments table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS experiments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            duration INTEGER,
            state51_active INTEGER,
            anomalies_detected INTEGER,
            notes TEXT,
            data TEXT
          );
        `);

        console.log('Database initialized successfully');
        resolve();
      }, reject);
    });
  }

  /**
   * Save baseline data
   */
  async saveBaseline(baseline) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO baselines (timestamp, data) VALUES (?, ?)',
          [baseline.timestamp, JSON.stringify(baseline)],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Save anomaly
   */
  async saveAnomaly(anomaly) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO anomalies (
            timestamp, type, value, significance,
            cosmic_window, message, data
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            anomaly.timestamp,
            anomaly.type,
            anomaly.value || 0,
            anomaly.significance || 'low',
            anomaly.cosmicWindow ? 1 : 0,
            anomaly.message || '',
            JSON.stringify(anomaly.data || {})
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Save scan data
   */
  async saveScan(scan) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO scans (
            timestamp, battery_level, magnetic_field, acceleration,
            rotation, pressure, gps_accuracy, network_type,
            anomaly_count, cosmic_window, state51_active, data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            scan.timestamp,
            scan.battery?.level || 0,
            scan.sensors?.magneticField || 0,
            scan.sensors?.acceleration || 0,
            scan.sensors?.rotation || 0,
            scan.sensors?.pressure || 0,
            scan.sensors?.gpsAccuracy || 0,
            scan.network?.type || '',
            scan.anomalyCount || 0,
            scan.isCosmicWindow ? 1 : 0,
            scan.state51Active ? 1 : 0,
            JSON.stringify(scan)
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Get anomalies for a specific date range
   */
  async getAnomalies(startTime, endTime) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM anomalies
           WHERE timestamp >= ? AND timestamp <= ?
           ORDER BY timestamp DESC`,
          [startTime, endTime],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Get scans for analysis
   */
  async getScans(startTime, endTime) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM scans
           WHERE timestamp >= ? AND timestamp <= ?
           ORDER BY timestamp ASC`,
          [startTime, endTime],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Analyze patterns in the data
   */
  async analyzePatterns() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    // Get recent anomalies
    const recentAnomalies = await this.getAnomalies(oneHourAgo, now);
    const dailyAnomalies = await this.getAnomalies(oneDayAgo, now);

    // Count by type
    const typeCount = {};
    const cosmicWindowCount = { true: 0, false: 0 };
    const significanceCount = { high: 0, medium: 0, low: 0, critical: 0 };

    dailyAnomalies.forEach(anomaly => {
      typeCount[anomaly.type] = (typeCount[anomaly.type] || 0) + 1;
      cosmicWindowCount[anomaly.cosmic_window === 1] += 1;
      significanceCount[anomaly.significance] += 1;
    });

    // Check for patterns
    const anomalySpike = recentAnomalies.length > dailyAnomalies.length / 24 * 2;
    const cosmicCorrelation = cosmicWindowCount.true / (cosmicWindowCount.true + cosmicWindowCount.false);

    // Check for State 51 patterns
    const state51Patterns = dailyAnomalies.filter(a =>
      a.type.includes('51') ||
      Math.abs(a.value - 51) < 1 ||
      Math.abs(a.value - 0.51) < 0.01
    );

    // Check for 7.7% patterns
    const mutationPatterns = dailyAnomalies.filter(a =>
      Math.abs(a.value - 0.077) < 0.001 ||
      Math.abs(a.value - 7.7) < 0.1 ||
      a.type.includes('777')
    );

    return {
      anomalyCount: dailyAnomalies.length,
      recentCount: recentAnomalies.length,
      anomalySpike,
      cosmicCorrelation,
      typeDistribution: typeCount,
      significanceDistribution: significanceCount,
      state51Count: state51Patterns.length,
      mutationCount: mutationPatterns.length,
      patterns: {
        hasState51: state51Patterns.length > 0,
        hasMutation: mutationPatterns.length > 0,
        hasCosmicCorrelation: cosmicCorrelation > 0.5
      }
    };
  }

  /**
   * Generate daily report
   */
  async generateDailyReport(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const anomalies = await this.getAnomalies(startOfDay.getTime(), endOfDay.getTime());
    const scans = await this.getScans(startOfDay.getTime(), endOfDay.getTime());

    // Analyze anomalies
    const report = {
      date: date.toISOString().split('T')[0],
      totalAnomalies: anomalies.length,
      highSignificance: anomalies.filter(a => a.significance === 'high' || a.significance === 'critical').length,
      cosmicWindowAnomalies: anomalies.filter(a => a.cosmic_window === 1).length,
      state51Correlations: anomalies.filter(a => a.type.includes('51')).length,
      batteryAnomalies: anomalies.filter(a => a.type.includes('battery')).length,
      magneticAnomalies: anomalies.filter(a => a.type.includes('magnetic')).length,
      frequencyMatches: anomalies.filter(a => a.type.includes('frequency')).length,
    };

    // Analyze scans for trends
    if (scans.length > 0) {
      const batteryTrend = this.calculateTrend(scans.map(s => s.battery_level));
      const magneticTrend = this.calculateTrend(scans.map(s => s.magnetic_field));

      report.trends = {
        battery: batteryTrend,
        magnetic: magneticTrend,
        scanCount: scans.length
      };
    }

    // Calculate correlation with State 51 activation
    const state51ActiveScans = scans.filter(s => s.state51_active === 1);
    const state51AnomalyRate = state51ActiveScans.length > 0
      ? anomalies.filter(a => {
          const scan = scans.find(s => Math.abs(s.timestamp - a.timestamp) < 60000);
          return scan && scan.state51_active === 1;
        }).length / state51ActiveScans.length
      : 0;

    report.state51Effect = {
      activePeriods: state51ActiveScans.length,
      anomalyRate: state51AnomalyRate,
      correlation: state51AnomalyRate > 0.1 ? 'positive' : 'none'
    };

    // Key findings
    report.keyFindings = [];

    if (report.state51Correlations > 5) {
      report.keyFindings.push('Multiple State 51 resonances detected');
    }

    if (report.cosmicWindowAnomalies / report.totalAnomalies > 0.5) {
      report.keyFindings.push('High cosmic window correlation');
    }

    if (report.batteryAnomalies > 0) {
      report.keyFindings.push('Battery anomalies detected');
    }

    if (report.frequencyMatches > 0) {
      report.keyFindings.push('Quantum frequency matches found');
    }

    // Save report
    await this.saveDailyReport(report);

    return report;
  }

  /**
   * Save daily report to database
   */
  async saveDailyReport(report) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO daily_reports (
            date, total_anomalies, high_significance_count,
            cosmic_window_anomalies, state51_correlations,
            battery_anomalies, magnetic_anomalies,
            frequency_matches, report_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            report.date,
            report.totalAnomalies,
            report.highSignificance,
            report.cosmicWindowAnomalies,
            report.state51Correlations,
            report.batteryAnomalies,
            report.magneticAnomalies,
            report.frequencyMatches,
            JSON.stringify(report)
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Get daily reports
   */
  async getDailyReports(limit = 30) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM daily_reports
           ORDER BY date DESC
           LIMIT ?`,
          [limit],
          (_, { rows }) => {
            const reports = rows._array.map(row => ({
              ...row,
              report_data: JSON.parse(row.report_data)
            }));
            resolve(reports);
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Calculate trend from array of values
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    const percentChange = (change / firstAvg) * 100;

    if (Math.abs(percentChange) < 1) return 'stable';
    if (percentChange > 0) return `increasing ${percentChange.toFixed(1)}%`;
    return `decreasing ${Math.abs(percentChange).toFixed(1)}%`;
  }

  /**
   * Export data for external analysis
   */
  async exportData() {
    const anomalies = await this.getAnomalies(0, Date.now());
    const scans = await this.getScans(0, Date.now());
    const reports = await this.getDailyReports(365);

    return {
      exportDate: new Date().toISOString(),
      anomalies,
      scans,
      reports,
      statistics: {
        totalAnomalies: anomalies.length,
        totalScans: scans.length,
        totalReports: reports.length
      }
    };
  }
}

const instance = new DatabaseService();

export const initializeDatabase = () => instance.initialize();
export default instance;