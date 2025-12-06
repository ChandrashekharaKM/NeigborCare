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
  Platform,
  StatusBar,
  Dimensions,
  Linking
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

// IMPORT NOTIFICATION SERVICE
import { registerForPushNotificationsAsync } from '../services/NotificationService';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { state: authState, authContext } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Feature Toggles
  const [isResponder, setIsResponder] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true); 
  const [pushEnabled, setPushEnabled] = useState(false); // State for push notification switch

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (authState.user) {
        console.log("Auth User ID:", authState.user.id);
        const profile = await apiService.getUserProfile(authState.user.id);
        console.log("Backend Profile Data:", profile); 

        setUserProfile(profile);
        setIsResponder(profile.is_responder || authState.user.role === 'responder');
        
        // TODO: In a real app, check if push token exists on backend to set initial 'pushEnabled' state
      }
    } catch (error) {
      console.log('Error loading profile, falling back to Auth Data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
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

  // --- NOTIFICATION LOGIC ---
  const handleToggleNotifications = async (value: boolean) => {
    setPushEnabled(value);
    if (value) {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          Alert.alert("Success", "Push Notifications Enabled!");
          console.log("Device Token:", token);
          // TODO: Call API to save token to user profile
          // await apiService.updatePushToken(authState.user.id, token);
        } else {
          setPushEnabled(false); // Revert if failed or cancelled
          Alert.alert("Permission Required", "Please enable notifications in your phone settings.");
        }
      } catch (error) {
        console.error("Notification Error:", error);
        setPushEnabled(false);
      }
    }
  };

  const getDisplayName = () => {
    if (userProfile?.name) return userProfile.name;
    if (authState.user?.name) return authState.user.name;
    if (authState.user?.fullName) return authState.user.fullName;
    return "Neighbor User";
  };

  const getDisplayPhone = () => {
    if (userProfile?.phone_number) return userProfile.phone_number;
    if (userProfile?.mobile) return userProfile.mobile;
    if (authState.user?.phone) return authState.user.phone;
    if (authState.user?.email) return authState.user.email;
    return "No Contact Info";
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name ? name[0].toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ================= HEADER ================= */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>My Profile</Text>
          
          <TouchableOpacity onPress={() => Alert.alert("Edit", "Edit Profile coming soon")}>
             <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ================= PROFILE CARD ================= */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
             <View style={styles.avatar}>
               <Text style={styles.avatarText}>{getInitials()}</Text>
             </View>
             {isResponder && (
               <View style={styles.badgeIcon}>
                 <MaterialCommunityIcons name="shield-check" size={20} color="#fff" />
               </View>
             )}
          </View>

          <Text style={styles.profileName}>{getDisplayName()}</Text>
          <Text style={styles.profilePhone}>{getDisplayPhone()}</Text>

          <View style={[styles.roleBadge, { backgroundColor: isResponder ? '#DC2626' : '#2563EB' }]}>
            <Text style={styles.roleText}>
              {isResponder ? 'CERTIFIED RESPONDER' : 'COMMUNITY MEMBER'}
            </Text>
          </View>
        </View>

        {/* ================= USER DATA SECTIONS ================= */}
        {isResponder ? (
          <View style={styles.sectionContainer}>
             <Text style={styles.sectionHeader}>🚑 Responder Dashboard</Text>
             
             <View style={styles.actionRow}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                   <View style={[styles.iconBox, { backgroundColor: isAvailable ? '#DCFCE7' : '#F1F5F9' }]}>
                      <FontAwesome5 name="power-off" size={18} color={isAvailable ? '#16A34A' : '#64748B'} />
                   </View>
                   <View style={{marginLeft: 12}}>
                     <Text style={styles.rowTitle}>Available for SOS</Text>
                     <Text style={styles.rowSub}>Receive nearby alerts</Text>
                   </View>
                </View>
                <Switch 
                  value={isAvailable} 
                  onValueChange={setIsAvailable} 
                  trackColor={{false: '#E2E8F0', true: '#DC2626'}}
                  thumbColor="#fff"
                />
             </View>

             <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                   <Text style={styles.statNum}>{userProfile?.successful_responses || 0}</Text>
                   <Text style={styles.statLabel}>Responded</Text>
                </View>
                <View style={styles.statBox}>
                   <Text style={styles.statNum}>{userProfile?.total_lives_helped || 0}</Text>
                   <Text style={styles.statLabel}>Lives Helped</Text>
                </View>
                <View style={styles.statBox}>
                   <Text style={styles.statNum}>5.0</Text>
                   <Text style={styles.statLabel}>Rating</Text>
                </View>
             </View>
          </View>
        ) : (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>🏥 Medical ID (Critical)</Text>
            
            <View style={styles.medicalRow}>
               <View style={styles.medicalItem}>
                  <Text style={styles.medLabel}>Blood Type</Text>
                  <Text style={styles.medValue}>{userProfile?.blood_type || '--'}</Text>
               </View>
               <View style={styles.medicalDivider} />
               <View style={styles.medicalItem}>
                  <Text style={styles.medLabel}>Allergies</Text>
                  <Text style={styles.medValue}>{userProfile?.allergies || 'None'}</Text>
               </View>
               <View style={styles.medicalDivider} />
               <View style={styles.medicalItem}>
                  <Text style={styles.medLabel}>Age</Text>
                  <Text style={styles.medValue}>{userProfile?.age || '--'}</Text>
               </View>
            </View>

            <TouchableOpacity 
              style={styles.actionButtonOutline}
              onPress={() => navigation.navigate('MedicalRecords')}
            >
               <Text style={styles.actionBtnText}>Update Medical Records</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= SETTINGS ================= */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>⚙️ Account Settings</Text>

          {/* Emergency Contacts */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('EmergencyContacts')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, {backgroundColor: '#FEF2F2'}]}>
                <Ionicons name="people" size={20} color="#DC2626" />
              </View>
              <Text style={styles.settingText}>Emergency Contacts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, {backgroundColor: '#F0F9FF'}]}>
                <Ionicons name="notifications" size={20} color="#0284C7" />
              </View>
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch 
              value={pushEnabled} 
              onValueChange={handleToggleNotifications} 
              trackColor={{false: '#E2E8F0', true: '#DC2626'}} 
              thumbColor="#fff" 
            />
          </View>

          {/* Privacy */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => navigation.navigate('PrivacySecurity')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, {backgroundColor: '#FDF4FF'}]}>
                <Ionicons name="lock-closed" size={20} color="#9333EA" />
              </View>
              <Text style={styles.settingText}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

           {/* Help */}
           <TouchableOpacity 
             style={styles.settingRow}
             onPress={() => navigation.navigate('HelpSupport')}
           >
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, {backgroundColor: '#FFFBEB'}]}>
                <Ionicons name="help-circle" size={20} color="#D97706" />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
           <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>NeighborCare v1.0.2</Text>
        </View>

      </ScrollView>

      {/* ================= FOOTER ================= */}
      <View style={[styles.footer, { backgroundColor: '#DC2626' }]}>
        <TouchableOpacity onPress={() => Linking.openURL('tel:108')}>
          <Text style={styles.footerLink}>Call Ambulance (108)</Text>
        </TouchableOpacity>
        <Text style={styles.footerDivider}>|</Text>
        <TouchableOpacity onPress={() => Linking.openURL('tel:100')}>
          <Text style={styles.footerLink}>Police (100)</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerContainer: {
    backgroundColor: '#DC2626',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    elevation: 4, zIndex: 10
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  backButton: { padding: 4 },

  scrollContent: { padding: 20, paddingBottom: 80 },

  profileCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center',
    marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  avatarContainer: { marginBottom: 15, position: 'relative' },
  avatar: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff', elevation: 2
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#334155' },
  badgeIcon: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#DC2626',
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff'
  },
  profileName: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  profilePhone: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  sectionContainer: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05
  },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 15 },

  medicalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  medicalItem: { alignItems: 'center', flex: 1 },
  medLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  medValue: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  medicalDivider: { width: 1, backgroundColor: '#E2E8F0', height: '80%' },
  actionButtonOutline: {
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#DC2626',
    alignItems: 'center', marginTop: 5
  },
  actionBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },

  actionRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' 
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  rowSub: { fontSize: 12, color: '#64748B' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 20, fontWeight: '800', color: '#DC2626' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },

  settingRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' 
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingText: { fontSize: 15, fontWeight: '500', color: '#334155' },

  signOutBtn: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  
  versionContainer: { alignItems: 'center', marginBottom: 20 },
  versionText: { color: '#94A3B8', fontSize: 12 },

  footer: { 
    paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    position: 'absolute', bottom: 0, left: 0, right: 0 
  },
  footerLink: { color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
  footerDivider: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});