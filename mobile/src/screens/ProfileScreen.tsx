import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Award, Star, Activity, MapPin } from 'lucide-react-native';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>EW</Text>
        </View>
        <Text style={styles.name}>Eco Warrior</Text>
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

      <Text style={styles.sectionTitle}>Recent Badges</Text>
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
      
      <TouchableOpacity style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
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
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 24,
    marginLeft: 24,
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: 100,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  logoutBtn: {
    margin: 24,
    marginTop: 48,
    backgroundColor: '#ef444420',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef444450',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
