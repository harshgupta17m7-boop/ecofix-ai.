import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://192.168.1.9:8000/api';

export default function MapScreen({ navigation }: any) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchActiveProjects();
    }, [])
  );

  const fetchActiveProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects?status=active`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Error fetching map projects: ", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Centered around coordinate center of initial points
  const initialRegion = {
    latitude: 40.715,
    longitude: -74.007,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={darkMapStyle} // Apply dark mode map style
      >
        {projects.map((proj) => (
          <React.Fragment key={proj.id}>
            {/* The active project Pin marker */}
            <Marker
              coordinate={{ latitude: proj.latitude, longitude: proj.longitude }}
              title={proj.title}
              description={proj.volumetric_debris}
              pinColor="#10b981"
              onCalloutPress={() => navigation.navigate('ProjectDetail', { projectId: proj.id })}
            />
            {/* The Geospatial Broadcast Notification Ring (2 km radius circle) */}
            <Circle
              center={{ latitude: proj.latitude, longitude: proj.longitude }}
              radius={2000} // 2 kilometers
              fillColor="rgba(16, 185, 129, 0.08)"
              strokeColor="rgba(16, 185, 129, 0.25)"
              strokeWidth={1}
            />
            {/* The Duplicate De-duplication boundaries checks (25 meter radius circle) */}
            <Circle
              center={{ latitude: proj.latitude, longitude: proj.longitude }}
              radius={25} // 25 meters
              fillColor="rgba(239, 68, 68, 0.15)"
              strokeColor="rgba(239, 68, 68, 0.4)"
              strokeWidth={1}
            />
          </React.Fragment>
        ))}
      </MapView>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>MAP LEGEND</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Active Project Pin</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendRing, { borderColor: '#10b98150', backgroundColor: '#10b98110' }]} />
          <Text style={styles.legendText}>Broadcast ring (2km)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendRing, { borderColor: '#ef444480', backgroundColor: '#ef444420' }]} />
          <Text style={styles.legendText}>Duplicate boundary (25m)</Text>
        </View>
      </View>
    </View>
  );
}

// Custom dark mode JSON style array for react-native-maps (Google Maps provider style)
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

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
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1f2937e5',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 12,
  },
  legendTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendText: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
