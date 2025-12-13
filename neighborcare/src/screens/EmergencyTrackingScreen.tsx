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
  Platform,
  Linking
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from '../components/MapWrapper';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
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
  const { emergencyId, isResponderView } = route.params; 
  
  const { state: authState } = useAuth();
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  
  const hasShownResolvedAlert = useRef(false);
  const emergencyRef = useRef<Emergency | null>(null);
  
  const [otherPersonInfo, setOtherPersonInfo] = useState<any>(null); 
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  
  const [responderLocation, setResponderLocation] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    loadEmergencyStatus();
    
    if (authState.user) webSocketService.connect(authState.user.id);

    webSocketService.onResponderAccepted((data) => {
        if (!isResponderView) { 
            Alert.alert("Help is on the way!", "A nearby responder has accepted your alert.");
            loadEmergencyStatus();
        }
    });

    webSocketService.onResponderLocationUpdate((data) => {
        const newRespLoc = { latitude: data.latitude, longitude: data.longitude };
        setResponderLocation(newRespLoc);
        
        const currentEmergency = emergencyRef.current;
        if (currentEmergency) {
            fetchRoute(
                newRespLoc.latitude, 
                newRespLoc.longitude, 
                currentEmergency.latitude, 
                currentEmergency.longitude
            );
        }
    });

    const intervalId = setInterval(() => {
        loadEmergencyStatus(true);
    }, 5000);

    return () => {
        clearInterval(intervalId);
        webSocketService.off('responder_accepted');
        webSocketService.off('responder_location_update');
    };
  }, []);

  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    if (!startLat || !startLng || !endLat || !endLng) return;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.routes && json.routes.length > 0) {
        const route = json.routes[0];
        const coords = route.geometry.coordinates.map((point: number[]) => ({
          latitude: point[1],
          longitude: point[0],
        }));
        
        setRouteCoordinates(coords);
        setDistance(Math.round(route.distance)); 
        setEta(`${Math.ceil(route.duration / 60)} mins`);
      }
    } catch (error) {
      setRouteCoordinates([
        { latitude: startLat, longitude: startLng },
        { latitude: endLat, longitude: endLng }
      ]);
    }
  };

  const loadEmergencyStatus = async (silent = false) => {
    try {
      const status = await apiService.getEmergencyStatus(emergencyId);
      
      if (status.emergency.status === 'resolved' && !hasShownResolvedAlert.current) {
          hasShownResolvedAlert.current = true;
          
          if (isResponderView) {
              Alert.alert(
                  "Mission Complete", 
                  "Thank you for your service! 🚑 Lives helped count updated.",
                  [{ 
                      text: "Back to Dashboard", 
                      onPress: () => navigation.navigate('ResponderDashboard') 
                  }]
              );
          } else {
              Alert.alert(
                  "Resolved", 
                  "This emergency has been closed.",
                  [{ 
                      text: "Go Home", 
                      onPress: () => navigation.navigate('Home') 
                  }]
              );
          }
          return;
      }

      setEmergency(status.emergency);
      emergencyRef.current = status.emergency;

      if (isResponderView) {
         setOtherPersonInfo({ name: status.emergency.user?.name || "Victim", role: "Needs Help" });
         
         if (!responderLocation) { 
             const myLoc = await geolocationService.getCurrentLocation();
             if (myLoc) {
                 const startLoc = { latitude: myLoc.latitude, longitude: myLoc.longitude };
                 setResponderLocation(startLoc);
                 fetchRoute(startLoc.latitude, startLoc.longitude, status.emergency.latitude, status.emergency.longitude);
             }
         }
      } 
      else {
         if (status.responder) {
            setOtherPersonInfo(status.responder);
            if (status.responder.latitude && !responderLocation) {
                const rLoc = { latitude: status.responder.latitude, longitude: status.responder.longitude };
                setResponderLocation(rLoc);
                fetchRoute(rLoc.latitude, rLoc.longitude, status.emergency.latitude, status.emergency.longitude);
            }
         }
      }
      if (!silent) setLoading(false);
    } catch (error) {
      if (!silent) setLoading(false);
    }
  };

  const handleReachedLocation = async () => {
    Alert.alert(
      'Confirm Arrival',
      'Have you reached the victim and provided assistance?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, I have Reached',
          style: 'default',
          onPress: async () => {
            try {
              // This marks the mission as resolved and increments 'Lives Helped'
              await apiService.resolveEmergency(emergencyId);
              // The polling or alert logic above will handle navigation
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const handleResolveEmergency = async () => {
    Alert.alert(
      'Resolve Emergency',
      'Are you safe and is the emergency over?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Resolve',
          onPress: async () => {
            try {
              await apiService.resolveEmergency(emergencyId);
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
        <Text style={styles.loadingText}>Connecting...</Text>
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
        <Text style={styles.headerTitle}>{isResponderView ? 'Navigate to Victim' : 'Track Responder'}</Text>
        <View style={{width:40}} />
      </View>

      {/* MAP */}
      <View style={styles.mapContainer}>
        <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
                latitude: emergency?.latitude || 12.9716,
                longitude: emergency?.longitude || 77.5946,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }}
        >
            <Marker coordinate={{latitude: emergency?.latitude || 0, longitude: emergency?.longitude || 0}} title="Victim">
                <View style={styles.userMarker}>
                    <FontAwesome5 name="user" size={16} color="#fff" />
                </View>
            </Marker>

            {responderLocation && (
                <Marker coordinate={responderLocation} title="Responder">
                    <View style={styles.responderMarker}>
                         <FontAwesome5 name="ambulance" size={16} color="#fff" />
                    </View>
                </Marker>
            )}

            {routeCoordinates.length > 0 && (
                <Polyline coordinates={routeCoordinates} strokeColor="#DC2626" strokeWidth={4} />
            )}
        </MapView>
      </View>

      {/* INFO SHEET */}
      <View style={styles.infoSheet}>
        <Text style={styles.statusTitle}>
            {isResponderView ? "En Route to Scene" : (otherPersonInfo ? "Responder En Route" : "Searching for help...")}
        </Text>

        {otherPersonInfo && (
            <View style={styles.personRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{otherPersonInfo.name?.[0] || '?'}</Text>
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.personName}>{otherPersonInfo.name}</Text>
                    <Text style={styles.personRole}>
                        {isResponderView ? "Victim (Needs Help)" : "Certified Responder"}
                    </Text>
                </View>
                <View style={styles.etaBadge}>
                    <Text style={styles.etaText}>{eta || '...'}</Text>
                </View>
            </View>
        )}

        <Text style={styles.distText}>
            {distance ? `${distance}m (Road Distance)` : 'Calculating path...'}
        </Text>

        {/* ✅ DYNAMIC ACTION BUTTONS */}
        {isResponderView ? (
            <TouchableOpacity style={styles.reachedBtn} onPress={handleReachedLocation}>
                <Ionicons name="location" size={20} color="#fff" style={{marginRight: 10}} />
                <Text style={styles.btnText}>I HAVE REACHED</Text>
            </TouchableOpacity>
        ) : (
            <TouchableOpacity style={styles.resolveBtn} onPress={handleResolveEmergency}>
                <Text style={styles.btnText}>I AM SAFE (RESOLVE)</Text>
            </TouchableOpacity>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },

  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
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
  personRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#64748B' },
  personName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  personRole: { fontSize: 12, color: '#64748B' },
  etaBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  etaText: { color: '#DC2626', fontWeight: 'bold' },
  distText: { color: '#64748B', marginBottom: 20 },

  resolveBtn: { backgroundColor: '#22C55E', padding: 16, borderRadius: 12, alignItems: 'center' },
  
  // ✅ NEW REACHED BUTTON STYLE
  reachedBtn: { 
    backgroundColor: '#16A34A', // Green
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center',
    elevation: 4
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});