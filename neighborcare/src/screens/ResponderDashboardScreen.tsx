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
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    successful_responses: 0,
    emergency_alerts_received: 0,
    total_lives_helped: 0,
  });
  const [location, setLocation] = useState<LocationData | null>(null);
  const [incomingEmergency, setIncomingEmergency] = useState<any>(null);

  useEffect(() => {
    loadResponderStats();
    setupLocationTracking();

    // Simulate incoming emergency alerts
    const emergencyCheckInterval = setInterval(() => {
      // In production, this would be a WebSocket connection
      // For demo, we'll randomly show an alert
      if (Math.random() < 0.1) {
        simulateEmergencyAlert();
      }
    }, 5000);

    return () => clearInterval(emergencyCheckInterval);
  }, []);

  const loadResponderStats = async () => {
    try {
      if (authState.user) {
        const profile = await apiService.getUserProfile(authState.user.id);
        setStats({
          successful_responses: profile.successful_responses || 0,
          emergency_alerts_received: profile.emergency_alerts_received || 0,
          total_lives_helped: profile.total_lives_helped || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const setupLocationTracking = async () => {
    try {
      const currentLocation = await geolocationService.getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
      }

      // Start periodic location updates
      geolocationService.startLocationTracking((newLocation) => {
        setLocation(newLocation);
      }, 10000); // Update every 10 seconds
    } catch (error) {
      console.error('Error setting up location tracking:', error);
    }
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    setIsAvailable(value);
    setLoading(true);

    try {
      if (authState.user && location) {
        await apiService.setResponderAvailability(
          authState.user.id,
          value,
          location.latitude,
          location.longitude
        );
        Alert.alert(
          'Status Updated',
          value ? 'You are now available for emergencies' : 'You are now offline'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update availability');
      setIsAvailable(!value);
    } finally {
      setLoading(false);
    }
  };

  const simulateEmergencyAlert = () => {
    if (isAvailable) {
      setIncomingEmergency({
        id: Math.random().toString(),
        type: ['Cardiac', 'Bleeding', 'Choking'][Math.floor(Math.random() * 3)],
        distance: Math.floor(Math.random() * 500) + 100,
        location: { latitude: 40.7128, longitude: -74.006 },
      });
    }
  };

  const handleAcceptEmergency = async () => {
    if (!incomingEmergency || !authState.user) return;

    try {
      await apiService.acceptEmergency(incomingEmergency.id, authState.user.id);
      Alert.alert('Emergency Accepted', 'You are now en route to the emergency!');
      setIncomingEmergency(null);
      navigation.navigate('RespondingEmergency', { emergencyId: incomingEmergency.id });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept emergency');
    }
  };

  const handleDeclineEmergency = async () => {
    if (!incomingEmergency || !authState.user) return;

    try {
      await apiService.declineEmergency(incomingEmergency.id, authState.user.id);
      setIncomingEmergency(null);
    } catch (error) {
      console.error('Error declining emergency:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Responder Mode</Text>
          <Text style={styles.subheading}>{authState.user?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.profileButton}>
            <Text style={styles.profileInitial}>
              {authState.user?.name?.[0].toUpperCase() || 'R'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Availability Toggle */}
      <View style={styles.availabilityCard}>
        <View style={styles.availabilityContent}>
          <Text style={styles.availabilityLabel}>Availability Status</Text>
          <Text style={styles.availabilityStatus}>
            {isAvailable ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={handleAvailabilityToggle}
          disabled={loading}
          trackColor={{ false: '#ccc', true: '#e74c3c' }}
          thumbColor={isAvailable ? '#e74c3c' : '#fff'}
        />
      </View>

      {/* Location */}
      {location && isAvailable && (
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>📍 Broadcasting Location</Text>
          <Text style={styles.locationCoords}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live tracking active</Text>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🚑</Text>
          <Text style={styles.statValue}>{stats.successful_responses}</Text>
          <Text style={styles.statLabel}>Successful Responses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔔</Text>
          <Text style={styles.statValue}>{stats.emergency_alerts_received}</Text>
          <Text style={styles.statLabel}>Alerts Received</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { flex: 1 }]}>
          <Text style={styles.statEmoji}>❤️</Text>
          <Text style={styles.statValue}>{stats.total_lives_helped}</Text>
          <Text style={styles.statLabel}>Lives Helped</Text>
        </View>
      </View>

      {/* Incoming Emergency Alert */}
      {incomingEmergency && (
        <View style={styles.emergencyAlertContainer}>
          <View style={styles.emergencyAlert}>
            <Text style={styles.emergencyAlertTitle}>🚨 EMERGENCY ALERT</Text>
            <Text style={styles.emergencyType}>{incomingEmergency.type}</Text>
            <Text style={styles.emergencyDistance}>
              {incomingEmergency.distance}m Away • Est. {Math.ceil(incomingEmergency.distance / 1.4)} min walk
            </Text>

            <View style={styles.alertButtons}>
              <TouchableOpacity
                style={[styles.alertButton, styles.acceptButton]}
                onPress={handleAcceptEmergency}
              >
                <Text style={styles.acceptButtonText}>ACCEPT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, styles.declineButton]}
                onPress={handleDeclineEmergency}
              >
                <Text style={styles.declineButtonText}>DECLINE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ResponseHistory')}
        >
          <Text style={styles.actionButtonEmoji}>📋</Text>
          <Text style={styles.actionButtonText}>Response History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Certification')}
        >
          <Text style={styles.actionButtonEmoji}>🎓</Text>
          <Text style={styles.actionButtonText}>Certifications</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📌 Remember</Text>
        <Text style={styles.infoText}>
          When you go online, you'll receive alerts for nearby emergencies. Only accept calls if you are truly available and safe to respond.
        </Text>
      </View>

      {/* Badges Section */}
      <View style={styles.badgesSection}>
        <Text style={styles.sectionTitle}>🏆 Badges & Achievements</Text>
        <View style={styles.badgesGrid}>
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>🌟</Text>
            <Text style={styles.badgeTitle}>Lifesaver</Text>
            <Text style={styles.badgeDesc}>5+ responses</Text>
          </View>
          <View style={[styles.badge, styles.unlockedBadge]}>
            <Text style={styles.badgeEmoji}>🔒</Text>
            <Text style={styles.badgeTitle}>Coming Soon</Text>
            <Text style={styles.badgeDesc}>More badges</Text>
          </View>
        </View>
      </View>
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
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  availabilityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availabilityContent: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  availabilityStatus: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  locationCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  locationCoords: {
    fontSize: 12,
    color: '#558b2f',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    color: '#558b2f',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  emergencyAlertContainer: {
    marginVertical: 15,
  },
  emergencyAlert: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emergencyAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emergencyType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emergencyDistance: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 15,
  },
  alertButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4caf50',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  declineButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginVertical: 15,
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
    fontSize: 28,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  badgesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  unlockedBadge: {
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  badgeDesc: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});
