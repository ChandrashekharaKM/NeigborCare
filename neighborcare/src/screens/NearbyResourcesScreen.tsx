import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import geolocationService from '../services/geolocation';
import apiService from '../services/api';
import { LocationData } from '../types';

export const NearbyResourcesScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const currentLocation = await geolocationService.getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        await loadNearbyResources(currentLocation);
      } else {
        Alert.alert('GPS Error', 'Could not determine your location.');
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const loadNearbyResources = async (loc: LocationData) => {
    try {
      // Fetch actual data from backend (which calls OSM)
      const response = await apiService.getNearbyResources(
        loc.latitude, 
        loc.longitude, 
        3000 // 3km radius search
      );
      setResources(response.resources || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load nearby resources.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirections = (lat: number, lon: number, name: string) => {
    // Opens Google Maps or Apple Maps
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lon}`;
    const label = name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) Linking.openURL(url);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getCategoryEmoji = (type: string) => {
    if (type.includes('hospital')) return '🏥';
    if (type.includes('clinic') || type.includes('doctors')) return '⚕️';
    if (type.includes('pharmacy')) return '💊';
    if (type.includes('police')) return '🚓';
    if (type.includes('fire')) return '🚒';
    return '📍';
  };

  const renderResourceCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{getCategoryEmoji(item.type)}</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{item.distance}m</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ADDRESS DISPLAY */}
      <Text style={styles.addressLabel}>ADDRESS:</Text>
      <Text style={styles.addressText}>
        {item.address !== "Address details unavailable" 
          ? item.address 
          : "📍 Tap 'Go Now' to see location on map"}
      </Text>

      <View style={styles.actionRow}>
        {item.phone && (
          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => handleCall(item.phone)}>
            <Text style={styles.btnTextOutline}>📞 Call</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.btn, styles.btnFill]} 
          onPress={() => handleDirections(item.latitude, item.longitude, item.name)}
        >
          <Text style={styles.btnTextFill}>🗺️ Go Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Scanning area for help...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nearby Help (Top 5)</Text>
        <View style={{width: 40}} />
      </View>

      {resources.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>No emergency resources found nearby.</Text>
          <Text style={styles.emptySubtext}>Try moving to a different area or searching manually.</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          renderItem={renderResourceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 15, color: '#999' },
  
  emptyEmoji: { fontSize: 50, marginBottom: 10 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#777', textAlign: 'center', marginTop: 5 },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50, backgroundColor: '#fff', elevation: 3,
  },
  backBtn: { fontSize: 16, color: '#e74c3c', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  list: { padding: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardEmoji: { fontSize: 32, marginRight: 15 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardType: { fontSize: 12, color: '#999', fontWeight: '600', marginTop: 2 },
  distanceBadge: {
    backgroundColor: '#e3f2fd', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12,
  },
  distanceText: { fontSize: 12, color: '#2196f3', fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  
  addressLabel: { fontSize: 10, color: '#bbb', fontWeight: '700', marginBottom: 4 },
  addressText: { fontSize: 13, color: '#444', lineHeight: 18, marginBottom: 15 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  btnOutline: { borderWidth: 1, borderColor: '#e74c3c' },
  btnFill: { backgroundColor: '#e74c3c' },
  btnTextOutline: { color: '#e74c3c', fontWeight: '600' },
  btnTextFill: { color: '#fff', fontWeight: '600' },
});