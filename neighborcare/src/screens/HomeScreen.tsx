import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import geolocationService from '../services/geolocation';
import { LocationData, Emergency } from '../types';

interface HomeScreenProps {
  navigation: any;
}

const EMERGENCY_TYPES = ['Cardiac', 'Bleeding', 'Choking', 'Fracture', 'Other'];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { state: authState, authContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<string | null>(null);
  const [ongoingEmergency, setOngoingEmergency] = useState<Emergency | null>(null);

  useEffect(() => {
    initializeLocation();
    loadEmergencyHistory();
  }, []);

  const initializeLocation = async () => {
    try {
      const permitted = await geolocationService.requestLocationPermissions();
      if (!permitted) {
        Alert.alert('Permission Denied', 'Location access is required for NeighborCare');
        return;
      }

      const currentLocation = await geolocationService.getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    }
  };

  const loadEmergencyHistory = async () => {
    try {
      if (authState.user) {
        const history = await apiService.getUserEmergencyHistory(authState.user.id);
        setEmergencies(history.emergencies);

        // Check for ongoing emergency
        const ongoing = history.emergencies.find((e: Emergency) => e.status === 'in-progress');
        if (ongoing) {
          setOngoingEmergency(ongoing);
        }
      }
    } catch (error) {
      console.error('Error loading emergency history:', error);
    }
  };

  const handleSOSPress = () => {
    setShowEmergencyModal(true);
  };

  const handleEmergencyTypeSelect = async (type: string) => {
    if (!location || !authState.user) {
      Alert.alert('Error', 'Location data not available');
      return;
    }

    setLoading(true);
    setShowEmergencyModal(false);

    try {
      const response = await apiService.createEmergency(
        authState.user.id,
        location.latitude,
        location.longitude,
        type
      );

      setOngoingEmergency(response.emergency);
      Alert.alert('SOS Sent', 'Emergency alert sent to nearby responders!');

      // Navigate to emergency tracking screen
      navigation.navigate('EmergencyTracking', { emergencyId: response.emergency.id });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send SOS');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authContext.signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {authState.user?.name}</Text>
          <Text style={styles.subheading}>Stay safe with NeighborCare</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.profileButton}>
            <Text style={styles.profileInitial}>
              {authState.user?.name?.[0].toUpperCase() || 'U'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Location Status */}
      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>📍 Your Location</Text>
        {location ? (
          <View>
            <Text style={styles.locationCoords}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
            <TouchableOpacity onPress={initializeLocation}>
              <Text style={styles.refreshLink}>Refresh Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityIndicator color="#e74c3c" />
        )}
      </View>

      {/* Ongoing Emergency */}
      {ongoingEmergency && (
        <View style={styles.ongoingCard}>
          <Text style={styles.emergencyTitle}>🚨 Emergency in Progress</Text>
          <Text style={styles.emergencyType}>{ongoingEmergency.emergency_type}</Text>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() =>
              navigation.navigate('EmergencyTracking', {
                emergencyId: ongoingEmergency.id,
              })
            }
          >
            <Text style={styles.trackButtonText}>Track Responder</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SOS Button */}
      <View style={styles.sosContainer}>
        <TouchableOpacity
          style={[styles.sosButton, loading && styles.sosButtonDisabled]}
          onPress={handleSOSPress}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>Tap for Emergency</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Emergency Type Modal */}
      <Modal visible={showEmergencyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>What's the Emergency?</Text>
            <Text style={styles.modalSubtitle}>
              Select the type of emergency to alert nearby responders
            </Text>

            <View style={styles.emergencyTypesList}>
              {EMERGENCY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.typeButton}
                  onPress={() => handleEmergencyTypeSelect(type)}
                  disabled={loading}
                >
                  <Text style={styles.typeButtonText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEmergencyModal(false)}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recent Emergencies */}
      {emergencies.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>📋 Recent Emergencies</Text>
          {emergencies.slice(0, 3).map((emergency) => (
            <View key={emergency.id} style={styles.emergencyItem}>
              <View style={styles.emergencyItemLeft}>
                <Text style={styles.emergencyItemType}>{emergency.emergency_type}</Text>
                <Text style={styles.emergencyItemDate}>
                  {new Date(emergency.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View
                style={[
                  styles.emergencyItemStatus,
                  emergency.status === 'resolved'
                    ? styles.statusResolved
                    : emergency.status === 'in-progress'
                    ? styles.statusProgress
                    : styles.statusPending,
                ]}
              >
                <Text style={styles.emergencyItemStatusText}>
                  {emergency.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('EmergencyHistory')}
          >
            <Text style={styles.viewAllButtonText}>View All Emergencies</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('NearbyResources')}
        >
          <Text style={styles.actionButtonEmoji}>🏥</Text>
          <Text style={styles.actionButtonText}>Nearby Resources</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('BecomeResponder')}
        >
          <Text style={styles.actionButtonEmoji}>🤝</Text>
          <Text style={styles.actionButtonText}>Become Responder</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subheading: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  refreshLink: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  sosButtonDisabled: {
    opacity: 0.6,
  },
  sosText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  sosSubtext: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  ongoingCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  emergencyType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  trackButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  emergencyTypesList: {
    marginBottom: 20,
  },
  typeButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emergencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emergencyItemLeft: {
    flex: 1,
  },
  emergencyItemType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  emergencyItemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emergencyItemStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusResolved: {
    backgroundColor: '#d4edda',
  },
  statusProgress: {
    backgroundColor: '#fff3cd',
  },
  statusPending: {
    backgroundColor: '#f8d7da',
  },
  emergencyItemStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  viewAllButton: {
    paddingVertical: 10,
    marginTop: 10,
  },
  viewAllButtonText: {
    color: '#e74c3c',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
