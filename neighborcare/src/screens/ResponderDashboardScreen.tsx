import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import geolocationService from '../services/geolocation';
import { LocationData } from '../types';

interface ResponderDashboardScreenProps {
  navigation: any;
}

export const ResponderDashboardScreen: React.FC<ResponderDashboardScreenProps> = ({
  navigation,
}) => {
  const { state: authState } = useAuth();
  
  // --- STATE ---
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    successful_responses: 0,
    emergency_alerts_received: 0,
    total_lives_helped: 0,
  });
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [medicalResources, setMedicalResources] = useState<any[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // 1. ON MOUNT: Load Data & Start GPS
  useEffect(() => {
    loadResponderStats();
    initializeLocation();

    // Cleanup GPS on unmount
    return () => {
      geolocationService.stopLocationTracking();
    };
  }, []);

  // 2. ON LOCATION CHANGE: Fetch Nearby Hospitals
  useEffect(() => {
    if (location) {
      fetchRealNearbyResources(location);
    }
  }, [location]);

  // --- HELPER FUNCTIONS ---

  const initializeLocation = async () => {
    try {
      const hasPermission = await geolocationService.requestLocationPermissions();
      if (!hasPermission) {
        setGpsError('Permission Denied');
        Alert.alert('Permission Required', 'Please enable location access.');
        return;
      }

      const currentLoc = await geolocationService.getCurrentLocation();
      if (currentLoc) setLocation(currentLoc);

      geolocationService.startLocationTracking((newLoc) => {
        setLocation(newLoc);
      });
    } catch (error) {
      setGpsError('GPS Error');
    }
  };

  const fetchRealNearbyResources = async (loc: LocationData) => {
    try {
      setResourcesLoading(true);
      // Fetch real hospitals within 1km
      const data = await apiService.getNearbyResources(loc.latitude, loc.longitude, 1000);
      setMedicalResources(data.resources || []);
    } catch (error) {
      console.log('Failed to fetch resources');
    } finally {
      setResourcesLoading(false);
    }
  };

  const loadResponderStats = async () => {
    if (authState.user) {
      try {
        const profile = await apiService.getUserProfile(authState.user.id);
        setStats({
          successful_responses: profile.successful_responses || 0,
          emergency_alerts_received: profile.emergency_alerts_received || 0,
          total_lives_helped: profile.total_lives_helped || 0,
        });
      } catch (e) {}
    }
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    if (!location) {
      Alert.alert('Wait', 'Getting GPS location...');
      return;
    }
    setIsAvailable(value);
    setLoading(true);
    try {
      if (authState.user) {
        await apiService.setResponderAvailability(
          authState.user.id,
          value,
          location.latitude,
          location.longitude
        );
      }
    } catch (error) {
      setIsAvailable(!value);
    } finally {
      setLoading(false);
    }
  };

  const renderResourceItem = ({ item }: { item: any }) => (
    <View style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <Text style={styles.resourceEmoji}>🏥</Text>
        <View style={{flex: 1}}>
          <Text style={styles.resourceName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.resourceType}>{item.type.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.resourceAddress} numberOfLines={1}>{item.address}</Text>
      <Text style={styles.resourceDistance}>📍 {item.distance}m away</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* 1. HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Responder Mode</Text>
          <Text style={styles.subheading}>Ready to serve, {authState.user?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.profileButton}>
            <Text style={styles.profileInitial}>{authState.user?.name?.[0] || 'R'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. STATUS SWITCH */}
      <View style={styles.availabilityCard}>
        <View>
          <Text style={styles.availabilityLabel}>Current Status</Text>
          <Text style={[styles.availabilityStatus, isAvailable ? styles.textOnline : styles.textOffline]}>
            {isAvailable ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={handleAvailabilityToggle}
          disabled={loading || !location}
          trackColor={{ false: '#ccc', true: '#e74c3c' }}
          thumbColor={'#fff'}
        />
      </View>

      {/* 3. GPS BAR */}
      <View style={[styles.gpsBar, location ? styles.gpsOk : styles.gpsBad]}>
        <Text style={styles.gpsText}>
          {location 
            ? `📡 GPS Active: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` 
            : '🛰️ Acquiring Satellite Signal...'}
        </Text>
      </View>

      {/* 4. NEARBY RESOURCES */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏥 Nearby Facilities</Text>
          {location && (
            <TouchableOpacity onPress={() => fetchRealNearbyResources(location)}>
              <Text style={styles.refreshText}>🔄 Refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        {resourcesLoading ? (
          <ActivityIndicator size="small" color="#e74c3c" />
        ) : medicalResources.length > 0 ? (
          <FlatList
            data={medicalResources}
            renderItem={renderResourceItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.resourcesList}
          />
        ) : (
          <Text style={styles.emptyText}>No facilities found nearby.</Text>
        )}
      </View>

      {/* 5. STATS */}
      <Text style={styles.sectionTitle}>📊 My Impact</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🚑</Text>
          <Text style={styles.statValue}>{stats.successful_responses}</Text>
          <Text style={styles.statLabel}>Responses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>❤️</Text>
          <Text style={styles.statValue}>{stats.total_lives_helped}</Text>
          <Text style={styles.statLabel}>Lives Saved</Text>
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 20 },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, marginTop: 30
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subheading: { fontSize: 14, color: '#666' },
  profileButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#fff', fontWeight: 'bold' },

  availabilityCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2
  },
  availabilityLabel: { fontSize: 12, color: '#999' },
  availabilityStatus: { fontSize: 16, fontWeight: '700' },
  textOnline: { color: '#2ecc71' },
  textOffline: { color: '#95a5a6' },

  gpsBar: { padding: 8, borderRadius: 8, marginBottom: 20, alignItems: 'center' },
  gpsOk: { backgroundColor: '#e8f5e9' },
  gpsBad: { backgroundColor: '#fff3e0' },
  gpsText: { fontSize: 11, fontWeight: '600', color: '#555' },

  sectionContainer: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  refreshText: { fontSize: 12, color: '#3498db', fontWeight: '600' },
  
  resourcesList: { paddingRight: 20 },
  resourceCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginRight: 10, width: 180, elevation: 2
  },
  resourceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  resourceEmoji: { fontSize: 20, marginRight: 8 },
  resourceName: { fontWeight: 'bold', fontSize: 13, flex: 1 },
  resourceType: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  resourceAddress: { fontSize: 11, color: '#666', marginBottom: 5 },
  resourceDistance: { fontSize: 11, color: '#e74c3c', fontWeight: 'bold' },
  emptyText: { color: '#999', fontStyle: 'italic' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 15, alignItems: 'center', marginHorizontal: 5, elevation: 2 },
  statEmoji: { fontSize: 24, marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#999' },
});