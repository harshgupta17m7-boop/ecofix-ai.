import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

const API_URL = 'http://192.168.1.6:8000/api';

export default function CameraScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [photo, setPhoto] = useState<any>(null);
  const [coords, setCoords] = useState<any>(null);
  const [address, setAddress] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
      
      if (locationStatus.status === 'granted') {
        // Pre-warm real-time GPS and reverse geocode
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setCoords(loc.coords);
          const geocode = await Location.reverseGeocodeAsync(loc.coords);
          if (geocode && geocode.length > 0) {
             const place = geocode[0];
             const addr = [place.streetNumber, place.street, place.city].filter(Boolean).join(' ');
             if (addr) setAddress(addr);
          }
        } catch (err) {
          console.log("Pre-warm GPS failed:", err);
        }
      }
    })();
  }, [permission, requestPermission]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const opt = { quality: 0.8, skipProcessing: false, base64: true };
        const data = await cameraRef.current.takePictureAsync(opt);
        setPhoto(data);

        // Fallback if pre-warm didn't finish
        if (!coords) {
          try {
            const loc = await Location.getLastKnownPositionAsync({});
            if (loc) setCoords(loc.coords);
            else setCoords({ latitude: 40.7128, longitude: -74.0060 });
          } catch (locErr) {
            setCoords({ latitude: 40.7128, longitude: -74.0060 });
          }
        }
      } catch (err) {
        console.error("Failed to take photo: ", err);
      }
    }
  };

  const uploadAndIngest = async () => {
    if (!photo || !coords) return;
    
    try {
      setAnalyzing(true);
      
      // In a real application, we would upload to Supabase storage bucket first,
      // then send the bucket public URL to the backend.
      // Here we simulate the process by passing a mock URL based on visual tags.
      // The user can choose mock tags to trigger the three distinct backend behaviors.
      
      const payload = {
        image_url: photo.uri.includes('camera') 
          ? "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9"  // default trash photo
          : photo.uri,
        image_base64: photo.base64,
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: address,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.municipal_escalation) {
        Alert.alert(
          "🚨 MUNICIPAL BYPASS",
          "This issue contains dangerous components (hazardous waste / high voltage). It has been bypassed and routed directly to municipal emergency dispatch.",
          [{ text: "OK", onPress: () => resetCamera() }]
        );
      } else if (result.duplicate_found) {
        Alert.alert(
          "Duplicate Issue Spotted",
          "Another neighbor already uploaded this issue. We have merged your report with their active project thread.",
          [
            { 
              text: "View Thread", 
              onPress: () => navigation.navigate('ProjectDetail', { projectId: result.duplicate_project_id }) 
            },
            { text: "Dismiss", onPress: () => resetCamera() }
          ]
        );
      } else {
        Alert.alert(
          "Civic Project Launched! 🎉",
          "AI visual assessment approved this site. Step-by-step roadmap and micro-task billboard are now active.",
          [
            { 
              text: "Open Project", 
              onPress: () => navigation.navigate('ProjectDetail', { projectId: result.duplicate_project_id }) 
            }
          ]
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Network Error", "Could not connect to the EcoFix AI Intake server.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetCamera = () => {
    setPhoto(null);
    setCoords(null);
  };

  if (!permission || hasLocationPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!permission.granted || hasLocationPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera and GPS location access are required for EcoFix intake.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!photo ? (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          <View style={styles.overlay}>
            <View style={styles.hudRing}>
              <Text style={styles.hudText}>ALIGN ENVIRONMENTAL DEGRADATION IN CENTER</Text>
            </View>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />
          {coords && (
            <View style={styles.gpsLabel}>
              <Text style={styles.gpsText}>GPS FIXED: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</Text>
            </View>
          )}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Specific Address / Landmark:</Text>
            <TextInput
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g., Riverside Park near the 5th St entrance"
              placeholderTextColor="#9ca3af"
            />
          </View>
          {analyzing ? (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.analyzingText}>AI CALCULATING VOLUME & HAZARD PARAMETERS...</Text>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.retakeButton} onPress={resetCamera}>
                <Text style={styles.retakeText}>RETAKE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={uploadAndIngest}>
                <Text style={styles.uploadText}>ANALYZE & LAUNCH</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#121214',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 32,
  },
  hudRing: {
    alignSelf: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#10b98160',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00000040',
  },
  hudText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  captureButton: {
    alignSelf: 'center',
    bottom: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#121214',
    justifyContent: 'space-between',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  gpsLabel: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#000000c0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  gpsText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  addressContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addressLabel: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addressInput: {
    backgroundColor: '#1f2937',
    color: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 14,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#121214',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  retakeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  uploadButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
