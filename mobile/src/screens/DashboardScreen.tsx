/**
 * EcoFix AI - Dashboard Screen
 * ============================
 * The Dashboard acts as the primary community feed.
 * It displays active and recently completed civic action projects.
 * 
 * Flow:
 * 1. Fetches projects from the backend `/api/projects`.
 * 2. Renders a list of projects, displaying images, funding progress, and completion status.
 * 3. Tapping a project navigates the user to the ProjectDetailScreen.
 * 
 * Connections:
 * - Calls GET `/api/projects` on the backend.
 * - Navigates to `ProjectDetail` route in TabNavigator.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';

const API_URL = 'http://192.168.1.9:8000/api'; // Replace with local host IP for device builds

export default function DashboardScreen({ navigation }: any) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const projRes = await fetch(`${API_URL}/projects?status=active`);
      const projData = await projRes.json();
      setProjects(projData);
    } catch (error) {
      console.error("Error fetching dashboard data: ", error);
    } finally {
      setLoading(false);
    }
  };


  const renderProjectCard = ({ item }: any) => {
    // Determine color based on feasibility score
    const scoreColor = item.feasibility_score >= 80 ? '#10b981' : item.feasibility_score >= 60 ? '#f59e0b' : '#ef4444';
    const fundingProgress = (item.current_funds / item.estimated_cost) * 100;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
      >
        <Image source={{ uri: item.before_image_url }} style={styles.cardImage} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>{item.feasibility_score}% Match</Text>
            </View>
          </View>
          
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.tagRow}>
            <View style={styles.metricBadge}>
              <Text style={styles.metricText}>Volume: {item.volumetric_debris}</Text>
            </View>
            {item.safety_flags.map((flag: string, i: number) => (
              <View key={i} style={styles.safetyBadge}>
                <Text style={styles.safetyText}>{flag.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>

          {/* Crowdfunding progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Budget: ${item.current_funds} / ${item.estimated_cost}</Text>
              <Text style={styles.progressPercent}>{Math.round(fundingProgress)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, fundingProgress)}%` }]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectCard}
        onRefresh={fetchProjects}
        refreshing={loading}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyText}>No active community projects nearby.</Text>
            <Text style={styles.emptySubText}>Snap a photo of local litter/damage to launch the first task!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  centered: {
    flex: 1,
    backgroundColor: '#121214',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardImage: {
    height: 180,
    width: '100%',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  scoreBadge: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  metricBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
  },
  safetyBadge: {
    backgroundColor: '#ef444420',
    borderWidth: 0.5,
    borderColor: '#ef444460',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  safetyText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  progressPercent: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  emptyView: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },

});
