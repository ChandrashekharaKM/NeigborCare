import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Platform // <--- ADDED THIS
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import geolocationService from '../services/geolocation';
import webSocketService from '../services/socket';
import { Emergency } from '../types';

const { width } = Dimensions.get('window');

interface EmergencyTrackingScreenProps {
  navigation: any;
  route: any;
}

export const EmergencyTrackingScreen: React.FC<EmergencyTrackingScreenProps> = ({
  navigation,
  route,
}) => {
  const { emergencyId } = route.params;
  const { state: authState } = useAuth();
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [responderInfo, setResponderInfo] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  
  // Responder's Live Location (from Socket)
  const [responderLocation, setResponderLocation] = useState<any>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadEmergencyStatus();
    
    // Connect Socket
    if (authState.user) webSocketService.connect(authState.user.id);

    // Listen for Acceptance
    webSocketService.onResponderAccepted((data) => {
        Alert.alert("Help is on the way!", "A nearby responder has accepted your alert.");
        loadEmergencyStatus();
    });

    // Listen for Responder Movement
    webSocketService.onResponderLocationUpdate((data) => {
        console.log("📍 Moving Responder:", data);
        setResponderLocation({ latitude: data.latitude, longitude: data.longitude });
        
        // Update Distance/ETA locally
        if (emergency) {
            const dist = geolocationService.calculateDistance(
                emergency.latitude, emergency.longitude, 
                data.latitude, data.longitude
            );
            setDistance(dist);
            setEta(`${geolocationService.calculateETA(dist)} mins`);
        }
    });

    return () => {
        webSocketService.off('responder_accepted');
        webSocketService.off('responder_location_update');
    };
  }, []);

  const loadEmergencyStatus = async () => {
    try {
      const status = await apiService.getEmergencyStatus(emergencyId);
      setEmergency(status.emergency);

      if (status.responder) {
        setResponderInfo(status.responder);
        // Set initial responder location
        if (status.responder.latitude) {
            setResponderLocation({
                latitude: status.responder.latitude,
                longitude: status.responder.longitude
            });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading emergency status:', error);
      setLoading(false);
    }
  };

  const handleResolveEmergency = async () => {
    Alert.alert(
      'Resolve Emergency',
      'Has the responder arrived and are you safe?',
      [
        { text: 'No', onPress: () => {} },
        {
          text: 'Yes, Resolve',
          onPress: async () => {
            try {
              await apiService.resolveEmergency(emergencyId);
              Alert.alert('Success', 'Emergency resolved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } catch (error) {
              Alert.alert('Error', 'Failed to resolve emergency');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Connecting to network...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Tracking</Text>
        <View style={{width:40}} />
      </View>

      {/* MAP AREA */}
      <View style={styles.mapContainer}>
        <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            showsUserLocation={true}
            initialRegion={{
                latitude: emergency?.latitude || 12.9716,
                longitude: emergency?.longitude || 77.5946,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }}
        >
            {/* User Marker */}
            {emergency && (
                <Marker coordinate={{latitude: emergency.latitude, longitude: emergency.longitude}} title="You">
                    <View style={styles.userMarker}>
                        <FontAwesome5 name="user" size={16} color="#fff" />
                    </View>
                </Marker>
            )}

            {/* Responder Marker (Moving) */}
            {responderLocation && (
                <Marker coordinate={responderLocation} title="Responder">
                    <View style={styles.responderMarker}>
                         <FontAwesome5 name="ambulance" size={16} color="#fff" />
                    </View>
                </Marker>
            )}
        </MapView>
      </View>

      {/* INFO SHEET */}
      <View style={styles.infoSheet}>
        
        {responderInfo ? (
            <>
                <Text style={styles.statusTitle}>Responder En Route</Text>
                <View style={styles.responderRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{responderInfo.name[0]}</Text>
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.respName}>{responderInfo.name}</Text>
                        <Text style={styles.respRole}>Certified Responder</Text>
                    </View>
                    <View style={styles.etaBadge}>
                        <Text style={styles.etaText}>{eta || 'Calculating...'}</Text>
                    </View>
                </View>
                <Text style={styles.distText}>{distance ? `${distance}m away` : ''}</Text>
            </>
        ) : (
            <View style={styles.searchingBox}>
                <ActivityIndicator color="#DC2626" />
                <Text style={styles.searchingText}>Alerting nearby responders...</Text>
            </View>
        )}

        <TouchableOpacity style={styles.resolveBtn} onPress={handleResolveEmergency}>
            <Text style={styles.resolveText}>I AM SAFE (RESOLVE)</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },

  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 50,
    paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#DC2626', elevation: 4
  },
  backButton: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%' },

  userMarker: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  responderMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },

  infoSheet: {
    padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  statusTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  responderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#64748B' },
  respName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  respRole: { fontSize: 12, color: '#64748B' },
  etaBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  etaText: { color: '#DC2626', fontWeight: 'bold' },
  distText: { color: '#64748B', marginBottom: 20 },

  searchingBox: { alignItems: 'center', padding: 20 },
  searchingText: { marginTop: 10, color: '#64748B', fontStyle: 'italic' },

  resolveBtn: { backgroundColor: '#22C55E', padding: 16, borderRadius: 12, alignItems: 'center' },
  resolveText: { color: '#fff', fontWeight: 'bold' },
});