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

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { state: authState, authContext } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isResponder, setIsResponder] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (authState.user) {
        const profile = await apiService.getUserProfile(authState.user.id);
        setUserProfile(profile);
        setIsResponder(profile.is_responder || false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await authContext.signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userProfile?.name?.[0].toUpperCase() || 'U'}
            </Text>
          </View>
        </View>

        <Text style={styles.profileName}>{userProfile?.name}</Text>
        <Text style={styles.profilePhone}>{userProfile?.phone_number}</Text>

        {userProfile?.email && (
          <Text style={styles.profileEmail}>{userProfile.email}</Text>
        )}

        <View style={styles.typeIndicator}>
          <Text style={styles.typeText}>
            {isResponder ? '🚑 Responder' : '👤 Regular User'}
          </Text>
        </View>
      </View>

      {/* User Stats */}
      {!isResponder && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>📊 Your Activity</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Emergencies:</Text>
            <Text style={styles.statValue}>{userProfile?.total_emergencies || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Last Emergency:</Text>
            <Text style={styles.statValue}>
              {userProfile?.last_emergency_date ? 'Recently' : 'Never'}
            </Text>
          </View>
        </View>
      )}

      {/* Responder Stats */}
      {isResponder && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>🏆 Responder Stats</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Successful Responses:</Text>
            <Text style={styles.statValue}>{userProfile?.successful_responses || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Alerts Received:</Text>
            <Text style={styles.statValue}>{userProfile?.emergency_alerts_received || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Lives Helped:</Text>
            <Text style={styles.statValue}>{userProfile?.total_lives_helped || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Certified:</Text>
            <Text style={styles.statValue}>{userProfile?.is_certified ? '✓ Yes' : 'No'}</Text>
          </View>
        </View>
      )}

      {/* Settings Section */}
      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>⚙️ Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: '#ccc', true: '#e74c3c' }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Location Sharing</Text>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: '#ccc', true: '#e74c3c' }}
            thumbColor="white"
          />
        </View>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Change Password</Text>
          <Text style={styles.settingButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Privacy Policy</Text>
          <Text style={styles.settingButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Terms of Service</Text>
          <Text style={styles.settingButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Help Section */}
      <View style={styles.helpContainer}>
        <Text style={styles.sectionTitle}>❓ Help</Text>

        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>How to Use NeighborCare</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>Report a Problem</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>NeighborCare v1.0.0</Text>
        <Text style={styles.versionSubtext}>© 2024 Community Safety</Text>
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
    paddingVertical: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  typeIndicator: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e74c3c',
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  settingButtonArrow: {
    fontSize: 16,
    color: '#ccc',
  },
  helpContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  helpButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpButtonText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#ddd',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  versionSubtext: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 4,
  },
});
