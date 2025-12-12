import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  Linking,
  Vibration,
  Keyboard // <--- Added Keyboard import
} from 'react-native';
import MapView, { PROVIDER_DEFAULT } from '../components/MapWrapper'; 
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'; 
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import geolocationService from '../services/geolocation';
import webSocketService from '../services/socket'; 
import { LocationData } from '../types';

const { width } = Dimensions.get('window');

const EMERGENCY_TYPES = [
  { id: 'Medical', icon: 'heartbeat', color: '#EF4444', label: 'Medical' }, 
  { id: 'Accident', icon: 'car-crash', color: '#F59E0B', label: 'Accident' },
  { id: 'Cardiac', icon: 'procedures', color: '#DC2626', label: 'Cardiac' },
  { id: 'Other', icon: 'exclamation-triangle', color: '#6366F1', label: 'Other' },
];

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { state: authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [addressText, setAddressText] = useState('Acquiring...');
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedType, setSelectedType] = useState(EMERGENCY_TYPES[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const mapRef = useRef<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.005, longitudeDelta: 0.005,
  });
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    startPulse();
    getCurrentLocation();
    
    if (authState.user) {
      webSocketService.connect(authState.user.id);
    }
  }, [authState.user]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const response = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (response.length > 0) {
        const item = response[0];
        const city = item.city || item.subregion || item.region;
        const area = item.street || item.name;
        setAddressText(area ? `${area}, ${city}` : city || 'Unknown Location');
      }
    } catch (error) {
      setAddressText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const getCurrentLocation = async () => {
    if (isManualMode) return;
    try {
      setAddressText('Locating...');
      const loc = await geolocationService.getCurrentLocation();
      if (loc) {
        setLocation(loc);
        setMapRegion({ latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
        fetchAddress(loc.latitude, loc.longitude);
      }
    } catch (error) {
      setAddressText('Location unavailable');
    }
  };

  // ✅ NEW: Handle Text Search Geocoding
  const handleGeocode = async () => {
    if (!searchText.trim()) return;
    Keyboard.dismiss(); // Hide keyboard
    try {
      const geocodedLocation = await Location.geocodeAsync(searchText);
      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        
        // Update Map Region
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(newRegion);
        
        // Animate Camera to new location
        mapRef.current?.animateToRegion(newRegion, 1000);
      } else {
        Alert.alert('Not Found', 'Could not find the location entered.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to find location.');
    }
  };

  const confirmManualLocation = () => {
    setIsManualMode(true);
    // Use the center of the map as the new location
    setLocation({ latitude: mapRegion.latitude, longitude: mapRegion.longitude, heading: 0, speed: 0 });
    fetchAddress(mapRegion.latitude, mapRegion.longitude);
    setModalVisible(false);
  };

  const handleSOS = async () => {
    Vibration.vibrate([0, 500, 200, 500]);
    setLoading(true);
    try {
      let finalLocation = location || await geolocationService.getCurrentLocation();
      if (!finalLocation) {
        Alert.alert('Location Error', 'Please enable GPS.');
        setLoading(false);
        return;
      }
      if (authState.user) {
        const modeDesc = `Critical SOS: ${selectedType.label} Emergency.`; 
        
        const emergency = await apiService.createEmergency(
          authState.user.id,
          finalLocation.latitude,
          finalLocation.longitude,
          selectedType.id,
          modeDesc
        );

        webSocketService.emitCreateEmergency({
            emergency_id: emergency.emergency.id,
            user_id: authState.user.id,
            user_name: authState.user.name,
            latitude: finalLocation.latitude,
            longitude: finalLocation.longitude,
            emergency_type: selectedType.label
        });

        navigation.navigate('EmergencyTracking', { emergencyId: emergency.emergency.id });
      }
    } catch (error: any) {
      Alert.alert('Error', 'Could not create emergency alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.brandingRow}>
              <Text style={styles.appName}>Neighbor<Text style={styles.appNameBold}>Care</Text></Text>
            </View>
            <TouchableOpacity 
              style={styles.locationPill} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name={isManualMode ? "location" : "navigate"} size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.locationText} numberOfLines={1}>{addressText}</Text>
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
             <Text style={styles.profileInitials}>{authState.user?.name?.[0].toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sosWrapper}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <TouchableOpacity
            style={styles.sosBtn}
            onPress={handleSOS}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.sosContent}>
                <Ionicons name="alert-circle" size={38} color="#fff" style={{marginBottom: 4, opacity: 0.9}} />
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosSub}>PRESS FOR HELP</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.typeGrid}>
          {EMERGENCY_TYPES.map((type) => {
            const isSelected = selectedType.id === type.id;
            return (
              <TouchableOpacity 
                key={type.id}
                style={[
                  styles.typeCard, 
                  isSelected ? { backgroundColor: type.color, borderColor: type.color, elevation: 6 } : {}
                ]}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.7}
              >
                <FontAwesome5 
                  name={type.icon} 
                  size={20} 
                  color={isSelected ? '#FFF' : type.color} 
                  style={{ marginBottom: 8 }} 
                />
                <Text style={[
                  styles.typeLabel, 
                  isSelected && { color: '#FFF', fontWeight: '800' }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>Quick Healthcare Actions</Text>
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('NearbyResources')}>
            <View style={[styles.gridIcon, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="hospital-building" size={24} color="#DC2626" />
            </View>
            <Text style={styles.gridTitle}>Hospitals</Text>
            <Text style={styles.gridSub}>Nearby Facilities </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('EmergencyTracking')}>
            <View style={[styles.gridIcon, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="ambulance" size={24} color="#0284C7" />
            </View>
            <Text style={styles.gridTitle}>Ambulance</Text>
            <Text style={styles.gridSub}>Track Status </Text>
          </TouchableOpacity>
        </View>
        
         <View style={styles.gridRow}>
            <TouchableOpacity style={styles.gridCard} onPress={() => Alert.alert('Guide', 'First Aid Guide Coming Soon')}>
            <View style={[styles.gridIcon, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="medical-bag" size={24} color="#16A34A" />
            </View>
            <Text style={styles.gridTitle}>First Aid</Text>
            <Text style={styles.gridSub}>Emergency Guide </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('BecomeResponder')}>
            <View style={[styles.gridIcon, { backgroundColor: '#F3E8FF' }]}>
              <MaterialCommunityIcons name="hand-heart" size={24} color="#9333EA" />
            </View>
            <Text style={styles.gridTitle}>Volunteer</Text>
            <Text style={styles.gridSub}>Join Network </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { backgroundColor: '#DC2626' }]}>
        <TouchableOpacity onPress={() => Linking.openURL('https://policies.google.com/privacy')}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerDivider}>|</Text>
        
        <TouchableOpacity onPress={() => Linking.openURL('https://policies.google.com/terms')}>
          <Text style={styles.footerLink}>Terms of Service </Text>
        </TouchableOpacity>
      </View>

      {/* LOCATION MODAL */}
      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>
            <View style={styles.searchBar}>
              <TouchableOpacity onPress={handleGeocode}>
                 <Ionicons name="search" size={20} color="#94A3B8" />
              </TouchableOpacity>
              <TextInput 
                style={styles.input} 
                placeholder="Search location (e.g. MG Road)..." 
                value={searchText} 
                onChangeText={setSearchText}
                returnKeyType="search" // Keyboard says "Search"
                onSubmitEditing={handleGeocode} // Trigger on Enter
              />
            </View>
          </View>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef} 
              style={styles.map} 
              provider={PROVIDER_DEFAULT}
              initialRegion={mapRegion} 
              onRegionChangeComplete={(r: any) => setMapRegion(r)}
            />
            {/* Center Pin */}
            <View style={styles.fixedPin}>
              <Ionicons name="location" size={42} color="#DC2626" style={{ marginBottom: 42 }} />
            </View>
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => { setIsManualMode(false); setModalVisible(false); getCurrentLocation(); }}>
              <Text style={styles.btnSecText}>Use GPS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#DC2626' }]} onPress={confirmManualLocation}>
              <Text style={styles.btnPriText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  brandingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoIconBg: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  appName: { fontSize: 22, color: '#fff', fontWeight: '400' },
  appNameBold: { fontWeight: '800' },
  locationPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', 
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12,
    alignSelf: 'flex-start', maxWidth: '95%'
  },
  locationText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600', maxWidth: 200 },
  profileBtn: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', alignItems: 'center', marginTop: 4 
  },
  profileInitials: { fontSize: 16, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 60, paddingTop: 40 },
  sosWrapper: { alignItems: 'center', justifyContent: 'center', height: 220, marginBottom: 30 },
  pulseRing: { 
    position: 'absolute', 
    width: 210, height: 210, borderRadius: 105,
    backgroundColor: 'rgba(220, 38, 38, 0.15)', borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.1)'
  },
  sosBtn: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', 
    elevation: 12, shadowColor: '#DC2626', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16,
    borderWidth: 4, borderColor: '#FCA5A5'
  },
  sosContent: { alignItems: 'center' },
  sosText: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  sosSub: { fontSize: 11, color: '#FEE2E2', fontWeight: '700', marginTop: 0 },
  typeGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  typeCard: { 
    alignItems: 'center', width: '23%', backgroundColor: '#FFFFFF', paddingVertical: 14, 
    borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, 
    shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }
  },
  typeLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  sectionHeader: { fontSize: 17, fontWeight: '700', color: '#334155', marginBottom: 15, marginLeft: 4 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  gridCard: {
    width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 20,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, alignItems: 'center'
  },
  gridIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  gridSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  
  // Footer
  footer: { paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 0, left: 0, right: 0 },
  footerLink: { color: '#fff', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  footerDivider: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginHorizontal: 10 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  closeModalBtn: { marginRight: 15 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', height: 44, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, marginLeft: 10 },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%' },
  fixedPin: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
  modalFooter: { padding: 20, flexDirection: 'row', gap: 12 },
  btnSecondary: { flex: 1, backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnSecText: { fontWeight: '700', color: '#475569' },
  btnPrimary: { flex: 1.5, padding: 15, borderRadius: 12, alignItems: 'center' },
  btnPriText: { fontWeight: '700', color: '#fff' },
});