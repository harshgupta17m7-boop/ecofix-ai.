/**
 * EcoFix AI - Profile Screen
 * ==========================
 * Displays user statistics, earned gamification badges, and personal carbon footprint tracking.
 * 
 * Flow:
 * 1. Uses hardcoded/mock user ID ('user-1') to fetch profile details.
 * 2. Fetches user badges/achievements from the backend.
 * 3. Includes the "Carbon Tracker" UI for scanning bills/products.
 * 
 * Connections:
 * - Calls GET `/api/profiles/{id}`.
 * - Navigates to `EcoScanner` route when the scan button is pressed.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { Award, Star, Activity, MapPin, Zap, X, CheckCircle } from 'lucide-react-native';

const API_URL = 'http://192.168.1.9:8000/api';
const CURRENT_USER_ID = 'user-1';

export default function ProfileScreen() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [ecoScans, setEcoScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<string>("");

  useEffect(() => {
    fetchChallenges();
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const res = await fetch(`${API_URL}/my-scans`);
      const data = await res.json();
      setEcoScans(data);
    } catch (err) {
      console.error("Failed to fetch scans:", err);
    }
  };

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`${API_URL}/challenges`);
      const data = await res.json();
      setChallenges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      await fetch(`${API_URL}/challenges/${challengeId}/join`, { method: 'POST' });
      fetchChallenges(); // Refresh participants
    } catch (err) {
      console.error(err);
    }
  };

  const generateWeeklyReport = async () => {
    setReportModalVisible(true);
    setReportLoading(true);
    try {
      const res = await fetch(`${API_URL}/profiles/${CURRENT_USER_ID}/weekly-report`);
      const data = await res.json();
      setWeeklyReport(data.report_markdown);
    } catch (err) {
      console.error(err);
      setWeeklyReport("Failed to generate report. Make sure your Python server is running.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>ER</Text>
        </View>
        <Text style={styles.name}>Elena Rostova</Text>
        <Text style={styles.title}>Citizen Validator Level 4</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Activity color="#10b981" size={24} />
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        <View style={styles.statBox}>
          <Star color="#f59e0b" size={24} />
          <Text style={styles.statValue}>1,450</Text>
          <Text style={styles.statLabel}>Impact XP</Text>
        </View>
        <View style={styles.statBox}>
          <MapPin color="#3b82f6" size={24} />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Cleanups</Text>
        </View>
      </View>

      {ecoScans.length > 0 && (
        <View style={styles.profileHeader}>
          <Text style={styles.profileTitle}>My Carbon Tracker</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Avg Sustainability Score:</Text>
            <Text style={[styles.scoreValue, { 
              color: Math.round(ecoScans.reduce((sum, s) => sum + s.sustainability_score, 0) / ecoScans.length) >= 80 ? '#10b981' : 
                     Math.round(ecoScans.reduce((sum, s) => sum + s.sustainability_score, 0) / ecoScans.length) >= 50 ? '#f59e0b' : '#ef4444' 
            }]}>
              {Math.round(ecoScans.reduce((sum, s) => sum + s.sustainability_score, 0) / ecoScans.length)}/100
            </Text>
          </View>
          <Text style={styles.historyLabel}>Recent Scans ({ecoScans.length}):</Text>
          {ecoScans.slice(0, 3).map((scan, i) => (
            <View key={i} style={styles.scanItem}>
              <Text style={styles.scanModeText}>[{scan.scan_mode.toUpperCase()}]</Text>
              <Text style={styles.scanImpactText} numberOfLines={2}>{scan.environmental_impact}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.aiButton} onPress={generateWeeklyReport}>
          <Zap color="#ffffff" size={24} />
          <Text style={styles.aiButtonText}>Generate AI Weekly Report</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Green Badges</Text>
      <View style={styles.badgesContainer}>
        <View style={styles.badge}>
          <Award color="#10b981" size={32} />
          <Text style={styles.badgeText}>Hazard Spotter</Text>
        </View>
        <View style={styles.badge}>
          <Award color="#3b82f6" size={32} />
          <Text style={styles.badgeText}>First Responder</Text>
        </View>
        <View style={styles.badge}>
          <Award color="#f59e0b" size={32} />
          <Text style={styles.badgeText}>Community Leader</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Sustainable Challenges</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.challengesContainer}>
          {challenges.map(chal => (
            <View key={chal.id} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeTitle}>{chal.title}</Text>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>{chal.target_points} XP</Text>
                </View>
              </View>
              <Text style={styles.challengeDesc}>{chal.description}</Text>
              
              <View style={styles.challengeFooter}>
                <Text style={styles.participants}>{chal.current_participants} joined</Text>
                <TouchableOpacity 
                  style={styles.joinBtn} 
                  onPress={() => joinChallenge(chal.id)}
                >
                  <Text style={styles.joinBtnText}>Join Challenge</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* AI Report Modal */}
      <Modal visible={reportModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Sustainability Report</Text>
            <TouchableOpacity onPress={() => setReportModalVisible(false)}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {reportLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Gemini AI is analyzing your footprint...</Text>
              </View>
            ) : (
              <View style={styles.reportCard}>
                <CheckCircle color="#10b981" size={48} style={{ alignSelf: 'center', marginBottom: 16 }} />
                <Text style={styles.reportText}>{weeklyReport}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: '#10b981',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 24,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  aiButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  aiButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 24,
    marginLeft: 20,
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 16,
    width: '30%',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  challengesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  challengeCard: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  pointsBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 12,
  },
  challengeDesc: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 16,
  },
  participants: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  joinBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  profileHeader: {
    backgroundColor: '#1f2937',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  profileTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    color: '#d1d5db',
    fontSize: 14,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  historyLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  scanItem: {
    backgroundColor: '#121214',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  scanModeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scanImpactText: {
    color: '#d1d5db',
    fontSize: 12,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#121214',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#1f2937',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
  },
  reportCard: {
    backgroundColor: '#1f2937',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  reportText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 26,
  }
});
