import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import geolocationService from '../services/geolocation';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { state: authState } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Animation state for the pulsing effect
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    startPulse();
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleSOS = async () => {
    setLoading(true);
    try {
      // 1. Get Current Location
      const location = await geolocationService.getCurrentLocation();
      if (!location) {
        Alert.alert('GPS Error', 'Please enable location services to send an SOS.');
        setLoading(false);
        return;
      }

      // 2. Send Emergency Alert to Backend
      if (authState.user) {
        const emergency = await apiService.createEmergency(
          authState.user.id,
          location.latitude,
          location.longitude,
          'Medical' 
        );

        // 3. Navigate to Tracking Screen
        navigation.navigate('EmergencyTracking', { 
          emergencyId: emergency.emergency.id 
        });
      }
    } catch (error: any) {
      Alert.alert('Connection Error', 'Could not create emergency alert. Please call 911 directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackResponder = () => {
    // Navigate to tracking screen (using a placeholder ID for demo)
    navigation.navigate('EmergencyTracking', { 
      emergencyId: 'active_emergency_id' 
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 1. Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello,</Text>
          <Text style={styles.userName}>{authState.user?.name || 'Neighbor'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
          <Text style={styles.profileInitials}>{authState.user?.name?.[0].toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      {/* Location Indicator */}
      <View style={styles.locationBadge}>
        <Text style={styles.locationText}>📍 Location Services Active</Text>
      </View>

      {/* 2. MAIN SOS BUTTON (Pulsing) */}
      <View style={styles.sosContainer}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleSOS}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>Hold to Alert</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Emergency Actions</Text>

      {/* 3. Track Responder Card */}
      <TouchableOpacity style={styles.trackCard} onPress={handleTrackResponder}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🗺️</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Track Responder</Text>
          <Text style={styles.cardDesc}>View live location of incoming help</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Community & Tools</Text>

      {/* 4. Action Grid */}
      <View style={styles.grid}>
        {/* Nearby Help */}
        <TouchableOpacity 
          style={styles.gridCard} 
          onPress={() => navigation.navigate('NearbyResources')}
        >
          <Text style={styles.gridEmoji}>🏥</Text>
          <Text style={styles.gridTitle}>Nearby Help</Text>
        </TouchableOpacity>

        {/* Become Responder Link */}
        <TouchableOpacity 
          style={styles.gridCard} 
          onPress={() => navigation.navigate('BecomeResponder')}
        >
          <Text style={styles.gridEmoji}>🚑</Text>
          <Text style={styles.gridTitle}>Join Responders</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  welcomeText: { fontSize: 16, color: '#666' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  profileButton: {
    width: 45, height: 45, borderRadius: 25,
    backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center',
  },
  profileInitials: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  locationBadge: {
    backgroundColor: '#e8f5e9', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
    alignSelf: 'flex-start', marginBottom: 40,
    borderWidth: 1, borderColor: '#c8e6c9'
  },
  locationText: { color: '#2e7d32', fontWeight: '600', fontSize: 12 },

  // SOS Button Styles
  sosContainer: {
    alignItems: 'center', justifyContent: 'center',
    height: 250, marginBottom: 30,
  },
  pulseCircle: {
    position: 'absolute', width: 230, height: 230,
    borderRadius: 115, backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  sosButton: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#e74c3c',
    justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: '#e74c3c', shadowOpacity: 0.4, shadowRadius: 10,
    borderWidth: 4, borderColor: '#fff',
  },
  sosText: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  sosSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: 5 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },

  // Track Card Styles
  trackCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 15,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
  },
  iconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center',
    marginRight: 15,
  },
  iconEmoji: { fontSize: 24 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  arrow: { fontSize: 20, color: '#ccc', fontWeight: 'bold' },

  // Grid Styles
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCard: {
    backgroundColor: '#fff', width: '48%', padding: 20,
    borderRadius: 16, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
  },
  gridEmoji: { fontSize: 32, marginBottom: 10 },
  gridTitle: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center' },
});