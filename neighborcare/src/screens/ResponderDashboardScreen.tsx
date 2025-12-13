import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Platform,
  StatusBar,
  Dimensions,
  Linking
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native'; // ✅ NEW IMPORT
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import geolocationService from '../services/geolocation';
import webSocketService from '../services/socket'; 
import { LocationData } from '../types';

const { width } = Dimensions.get('window');

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
  
  // Stats State
  const [stats, setStats] = useState({
    successful_responses: 0,      
    emergency_alerts_received: 0, 
    total_lives_helped: 0,        
  });
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [activeMission, setActiveMission] = useState<any>(null); 
  const [medicalResources, setMedicalResources] = useState<any[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [addressText, setAddressText] = useState('Locating...');
  const mapRef = useRef<MapView>(null);
  const hasFetchedInitialResources = useRef(false);

  // ✅ 1. FETCH FRESH STATS WHENEVER SCREEN IS FOCUSED
  useFocusEffect(
    useCallback(() => {
      loadResponderStats();
    }, [authState.user])
  );

  // 2. ON MOUNT
  useEffect(() => {
    initializeLocation();
    
    // Connect Socket
    if (authState.user) {
        webSocketService.connect(authState.user.id);
    }

    // ⚡ LISTEN FOR REAL-TIME ALERTS ⚡
    webSocketService.onEmergencyAlert((data) => {
        console.log("🚨 REAL-TIME ALERT RECEIVED:", data);
        
        // Increment "Alerts Received" immediately
        setStats(prev => ({
            ...prev,
            emergency_alerts_received: prev.emergency_alerts_received + 1
        }));

        if (isAvailable && !activeMission) {
            Alert.alert(
                "🚨 EMERGENCY ALERT",
                `${data.emergency_type} reported nearby.\nVictim: ${data.user_name}`,
                [
                    { text: "Decline", style: "cancel" },
                    { text: "ACCEPT MISSION", onPress: () => startMission(data) }
                ]
            );
        }
    });

    return () => { 
        geolocationService.stopLocationTracking(); 
        webSocketService.off('emergency_alert'); 
    };
  }, [isAvailable, activeMission]);

  // 3. ON LOCATION CHANGE
  useEffect(() => {
    if (location) {
      fetchAddress(location.latitude, location.longitude);
      if (!hasFetchedInitialResources.current) {
        fetchRealNearbyResources(location);
        hasFetchedInitialResources.current = true;
      }
    }
  }, [location]);

  // --- LOGIC ---
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (response.length > 0) {
        const item = response[0];
        const street = item.street || item.name;
        const city = item.city || item.subregion;
        setAddressText(street && city ? `${street}, ${city}` : city || street || 'Unknown Location');
      }
    } catch (error) {
      setAddressText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const initializeLocation = async () => {
    try {
      const hasPermission = await geolocationService.requestLocationPermissions();
      if (!hasPermission) {
        setAddressText('Permission Denied');
        return;
      }
      const currentLoc = await geolocationService.getCurrentLocation();
      if (currentLoc) setLocation(currentLoc);

      geolocationService.startLocationTracking((newLoc) => {
        setLocation(newLoc);
      });
    } catch (error) {
      setAddressText('GPS Error');
    }
  };

  const handleRecenter = async () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
      fetchAddress(location.latitude, location.longitude);
    } else {
      const currentLoc = await geolocationService.getCurrentLocation();
      if (currentLoc) setLocation(currentLoc);
    }
  };

  const fetchRealNearbyResources = async (loc: LocationData) => {
    if (resourcesLoading) return;
    try {
      setResourcesLoading(true);
      const data = await apiService.getNearbyResources(loc.latitude, loc.longitude, 2000);
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
        
        // ✅ Ensure Logic: Alerts >= Responses >= Lives
        // This is a visual safeguard, but the DB should be the source of truth
        const realAlerts = Math.max(profile.emergency_alerts_received || 0, profile.successful_responses || 0);
        
        setStats({
          successful_responses: profile.successful_responses || 0,
          emergency_alerts_received: realAlerts, 
          total_lives_helped: profile.total_lives_helped || 0,
        });
        
        if (profile.is_available !== undefined) setIsAvailable(profile.is_available);
      } catch (e) {}
    }
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    if (!location) {
      Alert.alert('GPS Required', 'Please wait for location signal.');
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
        webSocketService.emitResponderAvailability(authState.user.id, value);
      }
    } catch (error) {
      setIsAvailable(!value);
      Alert.alert("Error", "Could not update status.");
    } finally {
      setLoading(false);
    }
  };

  const startMission = async (data: any) => {
    try {
        await apiService.acceptEmergency(data.emergency_id, authState.user!.id);
        webSocketService.emitAcceptEmergency(data.emergency_id, authState.user!.id);

        // Update Local Stats
        setStats(prev => ({
            ...prev,
            successful_responses: prev.successful_responses + 1
        }));

        setActiveMission({
            id: data.emergency_id,
            victimName: data.user_name,
            type: data.emergency_type,
            location: {
                latitude: data.latitude,
                longitude: data.longitude,
                address: "Locating..." 
            }
        });

        geolocationService.startLocationTracking((newLoc) => {
            setLocation(newLoc);
            webSocketService.emitLocationUpdate(data.emergency_id, newLoc.latitude, newLoc.longitude);
        });

        navigation.navigate('EmergencyTracking', { 
            emergencyId: data.emergency_id,
            isResponderView: true 
        });

    } catch (error) {
        Alert.alert("Error", "Failed to accept mission.");
    }
  };

  const completeMission = async () => {
    if (!activeMission) return;

    try {
        setLoading(true);
        await apiService.resolveEmergency(activeMission.id);
        
        setStats(prev => ({
            ...prev,
            total_lives_helped: prev.total_lives_helped + 1
        }));

        Alert.alert("Mission Complete", "Great job! You helped save a life.", [
            { 
                text: "OK", 
                onPress: () => {
                    setActiveMission(null);
                    geolocationService.stopLocationTracking();
                    if (location && mapRef.current) {
                        mapRef.current.animateToRegion({
                            latitude: location.latitude,
                            longitude: location.longitude,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }, 1000);
                    }
                    // Refresh stats from server to be sure
                    loadResponderStats();
                } 
            }
        ]);
    } catch (error) {
        Alert.alert("Error", "Failed to complete mission.");
    } finally {
        setLoading(false);
    }
  };

  const openGoogleMaps = (targetLat: number, targetLng: number) => {
    if (!location) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${targetLat},${targetLng}&travelmode=driving`;
    Linking.openURL(url);
  };

  const renderResourceItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.resourceCard}
      onPress={() => openGoogleMaps(item.latitude, item.longitude)}
    >
      <View style={styles.resourceHeader}>
        <View style={styles.resourceIconBg}>
           <FontAwesome5 name="hospital" size={16} color="#DC2626" />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.resourceName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.resourceType}>{item.type}</Text>
        </View>
      </View>
      <Text style={styles.resourceAddress} numberOfLines={1}>{item.address}</Text>
      <View style={styles.distBadge}>
         <Text style={styles.resourceDistance}>{item.distance}m</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>Neighbor<Text style={styles.appNameBold}>Care</Text></Text>
            <View style={styles.locationPill}>
              <Ionicons name="location" size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.locationText} numberOfLines={1}>{addressText}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
             <Text style={styles.profileInitials}>{authState.user?.name?.[0].toUpperCase() || 'R'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <View style={{flex: 1}}>
          
          {/* MAP */}
          <View style={styles.mapContainer}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                showsUserLocation={true}
                showsMyLocationButton={false}
                initialRegion={{
                latitude: 12.9716, 
                longitude: 77.5946,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
                }}
            >
                {activeMission && (
                    <>
                        <Marker coordinate={activeMission.location} title="Victim Location">
                            <View style={styles.victimMarker}>
                                <FontAwesome5 name="exclamation" size={20} color="#fff" />
                            </View>
                        </Marker>
                        {location && (
                            <Polyline 
                                coordinates={[
                                    { latitude: location.latitude, longitude: location.longitude },
                                    { latitude: activeMission.location.latitude, longitude: activeMission.location.longitude }
                                ]}
                                strokeColor="#DC2626"
                                strokeWidth={4}
                                lineDashPattern={[1]}
                            />
                        )}
                    </>
                )}
            </MapView>

            <TouchableOpacity style={styles.gpsFab} onPress={handleRecenter} activeOpacity={0.8}>
              <Ionicons name="navigate" size={22} color="#DC2626" />
            </TouchableOpacity>
          </View>

          {/* DASHBOARD */}
          <View style={styles.dashboardContainer}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {activeMission ? (
                    /* MISSION CARD */
                    <View style={styles.missionCard}>
                        <View style={styles.missionHeader}>
                            <Text style={styles.missionTitle}>🚑 ACTIVE MISSION</Text>
                            <Text style={styles.missionTime}>In Progress</Text>
                        </View>
                        <View style={styles.missionInfo}>
                            <View style={{flex:1}}>
                                <Text style={styles.victimName}>{activeMission.victimName}</Text>
                                <Text style={styles.victimType}>{activeMission.type}</Text>
                                <Text style={styles.victimAddress}>{activeMission.location.address}</Text>
                            </View>
                            <TouchableOpacity style={styles.navBtn} onPress={() => openGoogleMaps(activeMission.location.latitude, activeMission.location.longitude)}>
                                <FontAwesome5 name="directions" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.completeBtn} onPress={completeMission} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.completeBtnText}>REPORT ARRIVAL / COMPLETE</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* NORMAL DASHBOARD */
                    <>
                        <View style={styles.statusCard}>
                            <View style={styles.statusInfo}>
                                <Text style={styles.statusLabel}>Duty Status</Text>
                                <View style={styles.statusBadgeRow}>
                                    <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#22C55E' : '#94A3B8' }]} />
                                    <Text style={[styles.statusText, { color: isAvailable ? '#15803D' : '#64748B' }]}>
                                        {isAvailable ? 'Active & Scanning' : 'Offline'}
                                    </Text>
                                </View>
                            </View>
                            {loading ? (
                                <ActivityIndicator size="small" color="#DC2626" />
                            ) : (
                                <Switch
                                    value={isAvailable}
                                    onValueChange={handleAvailabilityToggle}
                                    trackColor={{ false: '#E2E8F0', true: '#DC2626' }}
                                    thumbColor={'#fff'}
                                    style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                                />
                            )}
                        </View>

                        {/* STATS ROW */}
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <View style={[styles.statIconBg, { backgroundColor: '#F0F9FF' }]}>
                                    <MaterialCommunityIcons name="ambulance" size={24} color="#0284C7" />
                                </View>
                                <Text style={styles.statValue}>{stats.successful_responses}</Text>
                                <Text style={styles.statLabel}>Responded</Text>
                            </View>
                            <View style={styles.statCard}>
                                <View style={[styles.statIconBg, { backgroundColor: '#FEF2F2' }]}>
                                    <MaterialCommunityIcons name="heart-pulse" size={24} color="#DC2626" />
                                </View>
                                <Text style={styles.statValue}>{stats.total_lives_helped}</Text>
                                <Text style={styles.statLabel}>Lives</Text>
                            </View>
                            <View style={styles.statCard}>
                                <View style={[styles.statIconBg, { backgroundColor: '#FFF7ED' }]}>
                                    <MaterialCommunityIcons name="bell-ring" size={24} color="#EA580C" />
                                </View>
                                <Text style={styles.statValue}>{stats.emergency_alerts_received}</Text>
                                <Text style={styles.statLabel}>Alerts</Text>
                            </View>
                        </View>

                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionHeader}>Nearby Facilities</Text>
                            {location && (
                                <TouchableOpacity onPress={() => fetchRealNearbyResources(location)}>
                                    <Ionicons name="refresh" size={20} color="#64748B" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {resourcesLoading ? (
                            <ActivityIndicator size="small" color="#DC2626" style={{ marginTop: 10 }} />
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
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Tap refresh to find nearby hospitals.</Text>
                            </View>
                        )}
                    </>
                )}
                <View style={{height: 100}} />
            </ScrollView>
          </View>
      </View>

      {/* FOOTER */}
      <View style={[styles.footer, { backgroundColor: '#DC2626' }]}>
        <TouchableOpacity onPress={() => navigation.navigate('PrivacySecurity')}>
          <Text style={styles.footerLink}>Privacy & Policies</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },

  headerContainer: {
    backgroundColor: '#DC2626',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    elevation: 4, zIndex: 10
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, justifyContent: 'center' },
  
  appName: { fontSize: 24, color: '#fff', fontWeight: '400', marginBottom: 6 },
  appNameBold: { fontWeight: '800' },

  locationPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', 
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12,
    alignSelf: 'flex-start', maxWidth: '95%'
  },
  locationText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  
  profileBtn: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', alignItems: 'center', marginTop: 4 
  },
  profileInitials: { fontSize: 16, fontWeight: '700', color: '#fff' },

  mapContainer: { height: '35%', width: '100%', overflow: 'hidden' }, 
  map: { width: '100%', height: '100%' },
  
  gpsFab: {
    position: 'absolute', bottom: 35, right: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width: 0, height: 2}
  },

  dashboardContainer: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingTop: 20 }, 
  scrollContent: { padding: 20, paddingBottom: 80 },

  statusCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2
  },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 18, fontWeight: '800' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: {
    width: '31%', backgroundColor: '#fff', padding: 10, borderRadius: 16,
    alignItems: 'center', elevation: 2
  },
  statIconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },

  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 12, marginLeft: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingRight: 10 },
  resourcesList: { paddingRight: 20, paddingBottom: 10 },
  resourceCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 12, marginRight: 12, width: 160,
    elevation: 2, borderWidth: 1, borderColor: '#F1F5F9'
  },
  resourceHeader: { flexDirection: 'row', marginBottom: 8 },
  resourceIconBg: { width: 28, height: 28, backgroundColor: '#FEE2E2', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  resourceName: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  resourceType: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  resourceAddress: { fontSize: 11, color: '#94A3B8', marginBottom: 8 },
  distBadge: { alignSelf: 'flex-start', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  resourceDistance: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  emptyContainer: { alignItems: 'center', padding: 10 },
  emptyText: { color: '#94A3B8', fontStyle: 'italic', fontSize: 12 },

  missionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5,
    borderWidth: 1, borderColor: '#FEE2E2', marginBottom: 20
  },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10 },
  missionTitle: { fontSize: 14, fontWeight: '800', color: '#DC2626' },
  missionTime: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  missionInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  victimName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  victimType: { fontSize: 14, fontWeight: '600', color: '#DC2626', marginBottom: 4 },
  victimAddress: { fontSize: 13, color: '#64748B', maxWidth: '80%' },
  navBtn: { 
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#0284C7',
    justifyContent: 'center', alignItems: 'center', elevation: 3
  },
  completeBtn: {
    backgroundColor: '#22C55E', paddingVertical: 15, borderRadius: 12, alignItems: 'center'
  },
  completeBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  victimMarker: {
    backgroundColor: '#DC2626', width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff'
  },

  footer: { 
    paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    position: 'absolute', bottom: 0, left: 0, right: 0 
  },
  footerLink: { color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
});