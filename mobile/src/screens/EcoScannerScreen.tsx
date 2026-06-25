/**
 * EcoFix AI - EcoScanner Screen
 * =============================
 * This screen allows users to scan utility bills or products to evaluate their environmental footprint.
 * 
 * Flow:
 * 1. User selects a scan mode ("Product" or "Utility Bill").
 * 2. User captures an image using Expo Camera.
 * 3. The image is base64 encoded and sent to the backend `/api/eco-scan` route.
 * 4. AI analyzes the image, generating a sustainability score and greener alternatives.
 * 5. Results are displayed beautifully on screen.
 * 
 * Connections:
 * - Calls POST `/api/eco-scan` on the backend.
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const API_URL = 'http://192.168.1.9:8000/api';

export default function EcoScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [photo, setPhoto] = useState<any>(null);
  const [scanMode, setScanMode] = useState<'bill' | 'product'>('bill');
  const [analyzing, setAnalyzing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, [permission, requestPermission]);

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const opt = { quality: 0.8, skipProcessing: false, base64: true };
        const data = await cameraRef.current.takePictureAsync(opt);
        setPhoto(data);
      } catch (err) {
        console.error("Failed to take photo: ", err);
      }
    }
  };

  const uploadAndIngest = async () => {
    if (!photo) return;
    
    try {
      setAnalyzing(true);
      
      const payload = {
        image_url: photo.uri,
        image_base64: photo.base64,
        scan_mode: scanMode
      };

      const response = await fetch(`${API_URL}/eco-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      const tips = result.greener_alternatives.map((t: string) => `• ${t}`).join('\n');
      Alert.alert(
        `Sustainability Score: ${result.sustainability_score}/100`,
        `${result.environmental_impact}\n\nGreener Alternatives:\n${tips}`,
        [
          { 
            text: "Scan Another", 
            onPress: () => resetCamera() 
          }
        ]
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Network Error", "Could not connect to the EcoFix AI Intake server.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetCamera = () => {
    setPhoto(null);
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera access is required for EcoScan.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!photo ? (
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            facing={facing} 
            ref={cameraRef} 
            onCameraReady={() => setIsCameraReady(true)}
          />
          <View style={styles.overlay}>
            <View style={styles.hudRing}>
              <Text style={styles.hudText}>
                {scanMode === 'bill' ? "ALIGN UTILITY BILL IN CENTER" : "ALIGN PRODUCT IN CENTER"}
              </Text>
            </View>

            <View style={styles.modeToggleContainer}>
              <TouchableOpacity 
                style={[styles.modeButton, scanMode === 'bill' && styles.modeButtonActive]} 
                onPress={() => setScanMode('bill')}>
                <Text style={styles.modeText}>Utility Bill</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, scanMode === 'product' && styles.modeButtonActive]} 
                onPress={() => setScanMode('product')}>
                <Text style={styles.modeText}>Product</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />
          
          {analyzing ? (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.analyzingText}>AI ANALYZING FOOTPRINT...</Text>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.retakeButton} onPress={resetCamera}>
                <Text style={styles.retakeText}>RETAKE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={uploadAndIngest}>
                <Text style={styles.uploadText}>ANALYZE FOOTPRINT</Text>
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
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#121214',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  hudRing: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  hudText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modeButtonActive: {
    backgroundColor: '#10b981',
  },
  modeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  captureButton: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#121214',
  },
  previewImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'cover',
  },
  analyzingOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  analyzingText: {
    color: '#10b981',
    marginTop: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(55, 65, 81, 0.9)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  retakeText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#10b981',
    flex: 2,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
