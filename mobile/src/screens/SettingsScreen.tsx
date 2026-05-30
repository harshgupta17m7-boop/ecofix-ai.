import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { Bell, Moon, Shield, Info, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [locationServices, setLocationServices] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Bell color="#9ca3af" size={20} />
            <Text style={styles.rowText}>Push Notifications</Text>
          </View>
          <Switch 
            value={notifications} 
            onValueChange={setNotifications} 
            trackColor={{ false: '#374151', true: '#10b981' }}
          />
        </View>
        
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Moon color="#9ca3af" size={20} />
            <Text style={styles.rowText}>Dark Mode</Text>
          </View>
          <Switch 
            value={darkMode} 
            onValueChange={setDarkMode}
            trackColor={{ false: '#374151', true: '#10b981' }} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Permissions</Text>
        
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Shield color="#9ca3af" size={20} />
            <Text style={styles.rowText}>Location Services</Text>
          </View>
          <Switch 
            value={locationServices} 
            onValueChange={setLocationServices}
            trackColor={{ false: '#374151', true: '#10b981' }} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity style={styles.row}>
          <View style={styles.rowLeft}>
            <Info color="#9ca3af" size={20} />
            <Text style={styles.rowText}>Terms of Service</Text>
          </View>
          <ChevronRight color="#4b5563" size={20} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.row}>
          <View style={styles.rowLeft}>
            <Info color="#9ca3af" size={20} />
            <Text style={styles.rowText}>Privacy Policy</Text>
          </View>
          <ChevronRight color="#4b5563" size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>EcoFix AI Version 1.0.0 (Build 42)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  section: {
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    marginLeft: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 16,
    color: '#ffffff',
  },
  versionText: {
    textAlign: 'center',
    color: '#4b5563',
    fontSize: 12,
    marginTop: 32,
    marginBottom: 48,
  }
});
