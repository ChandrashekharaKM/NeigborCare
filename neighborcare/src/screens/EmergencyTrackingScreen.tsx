import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import geolocationService from '../services/geolocation';
import { Emergency } from '../types';

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

  useEffect(() => {
    loadEmergencyStatus();
    const interval = setInterval(loadEmergencyStatus, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const loadEmergencyStatus = async () => {
    try {
      const status = await apiService.getEmergencyStatus(emergencyId);
      setEmergency(status.emergency);

      if (status.responder) {
        setResponderInfo(status.responder);

        // Calculate distance and ETA
        const userLocation = await geolocationService.getCurrentLocation();
        if (userLocation && status.responder.latitude && status.responder.longitude) {
          const dist = geolocationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            status.responder.latitude,
            status.responder.longitude
          );
          setDistance(dist);

          const minutes = geolocationService.calculateETA(dist);
          setEta(`${minutes} mins`);
        }
      }

      if (status.emergency.status === 'resolved') {
        setLoading(false);
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
              Alert.alert(
                'Success',
                'Emergency resolved. Thank you for using NeighborCare!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to resolve emergency');
            }
          },
        },
      ]
    );
  };

  if (loading && !emergency) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading emergency status...</Text>
      </View>
    );
  }

  if (!emergency) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Emergency not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Emergency Type */}
      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyType}>{emergency.emergency_type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(emergency.status) }]}>
          <Text style={styles.statusText}>{emergency.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Responder Info */}
      {responderInfo ? (
        <View style={styles.responderCard}>
          <Text style={styles.sectionTitle}>🚑 Responder Assigned</Text>

          <View style={styles.responderInfo}>
            <View style={styles.responderAvatar}>
              <Text style={styles.avatarText}>
                {responderInfo.name?.[0].toUpperCase() || 'R'}
              </Text>
            </View>

            <View style={styles.responderDetails}>
              <Text style={styles.responderName}>{responderInfo.name}</Text>
              <Text style={styles.responderType}>
                {responderInfo.certification_type || 'Certified Responder'}
              </Text>
            </View>
          </View>

          {distance !== null && eta && (
            <View style={styles.etaContainer}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaValue}>{eta}</Text>
              <Text style={styles.distanceText}>
                {geolocationService.formatDistance(distance)} away
              </Text>
            </View>
          )}

          {emergency.status === 'in-progress' && (
            <View style={styles.liveTracking}>
              <Text style={styles.liveText}>● Live Tracking Active</Text>
              <Text style={styles.trackingNote}>
                The responder is on their way to you. Your location is being shared in real-time.
              </Text>
            </View>
          )}
        </View>
      ) : emergency.status === 'pending' ? (
        <View style={styles.pendingCard}>
          <ActivityIndicator color="#e74c3c" size="large" />
          <Text style={styles.pendingText}>Finding nearby responders...</Text>
        </View>
      ) : null}

      {/* Emergency Location */}
      <View style={styles.locationCard}>
        <Text style={styles.sectionTitle}>📍 Emergency Location</Text>
        <Text style={styles.coordinateText}>
          {emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)}
        </Text>
        <Text style={styles.createdTime}>
          Created: {new Date(emergency.created_at).toLocaleTimeString()}
        </Text>
      </View>

      {/* Action Button */}
      {emergency.status === 'in-progress' && (
        <TouchableOpacity style={styles.resolveButton} onPress={handleResolveEmergency}>
          <Text style={styles.resolveButtonText}>Resolve Emergency</Text>
        </TouchableOpacity>
      )}

      {emergency.status === 'resolved' && (
        <View style={styles.resolvedContainer}>
          <Text style={styles.resolvedEmoji}>✅</Text>
          <Text style={styles.resolvedText}>Emergency Resolved</Text>
          <Text style={styles.resolvedSubtext}>
            Thank you for using NeighborCare. Your incident has been logged.
          </Text>
        </View>
      )}
    </View>
  );
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#f8d7da';
    case 'in-progress':
      return '#fff3cd';
    case 'resolved':
      return '#d4edda';
    default:
      return '#e9ecef';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 20,
  },
  backButton: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emergencyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  emergencyType: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  responderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  responderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  responderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  responderDetails: {
    flex: 1,
  },
  responderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  responderType: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  etaContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 12,
    color: '#999',
  },
  etaValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginVertical: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
  liveTracking: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  liveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 6,
  },
  trackingNote: {
    fontSize: 12,
    color: '#558b2f',
    lineHeight: 18,
  },
  pendingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    marginBottom: 15,
    alignItems: 'center',
  },
  pendingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  coordinateText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  createdTime: {
    fontSize: 12,
    color: '#999',
  },
  resolveButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resolvedContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  resolvedEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  resolvedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  resolvedSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 20,
  },
});
