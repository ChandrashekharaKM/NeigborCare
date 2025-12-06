import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  StatusBar,
  Dimensions,
  Linking,
  Platform,
  RefreshControl,
  Image
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { registerForPushNotificationsAsync } from '../services/NotificationService';

const { width } = Dimensions.get('window');

export const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const { state: authState, authContext } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Feature State
  const [isResponder, setIsResponder] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false); 

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (authState.user) {
        // 1. Initial check from Local Auth (Fast)
        const localIsResponder = authState.user.is_responder || false;
        setIsResponder(localIsResponder);
        
        // 2. Fetch fresh data from Server (Authoritative)
        try {
          const profile = await apiService.getUserProfile(authState.user.id);
          if (profile) {
            setUserProfile(profile);
            
            // If server says we are a responder, update the UI immediately
            if (profile.is_responder === true) {
              setIsResponder(true);
            }
          }
        } catch (err) {
          console.log("Using cached Auth Data.");
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => authContext.signOut() }
    ]);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setPushEnabled(value);
    if (value) {
      const token = await registerForPushNotificationsAsync();
      if (token) Alert.alert("Success", "Push Enabled");
      else setPushEnabled(false);
    }
  };

  // --- FIXED DATA HELPERS (Prioritize Auth State) ---
  const getDisplayName = () => {
    // 1. Check Auth State FIRST (Correct Data)
    if (authState.user?.name) return authState.user.name;
    // 2. Fallback to API Profile
    if (userProfile?.name) return userProfile.name;
    // 3. Fallback
    return "Neighbor User";
  };

  const getDisplayPhone = () => {
    // 1. Check Auth State FIRST (Correct Data)
    if (authState.user?.phone_number) return authState.user.phone_number;
    if (authState.user?.phone) return authState.user.phone; // Legacy field check
    
    // 2. Fallback to API Profile
    if (userProfile?.phone_number) return userProfile.phone_number;
    
    return "No Contact Info";
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name && name.length > 0 ? name[0].toUpperCase() : 'U';
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  // ============================================================
  //  RENDER: RESPONDER PROFILE (RED THEME)
  // ============================================================
  if (isResponder) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
        
        {/* HEADER (RED) */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Responder Profile</Text>
            
            <TouchableOpacity onPress={() => Alert.alert("Edit", "Coming soon")}>
               <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* RESPONDER ID CARD */}
          <View style={styles.responderIdCard}>
            <View style={styles.idRow}>
              <View style={styles.avatarRed}>
                 <Text style={[styles.avatarText, { color: '#DC2626' }]}>{getInitials()}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.idName}>{getDisplayName()}</Text>
                <Text style={styles.idRole}>VERIFIED RESPONDER</Text>
                <Text style={styles.idPhone}>{getDisplayPhone()}</Text>
              </View>
              <MaterialCommunityIcons name="shield-check" size={40} color="#DC2626" />
            </View>
            
            <View style={styles.idDivider} />
            
            <View style={styles.idStatsRow}>
               <View style={styles.idStat}>
                 <Text style={styles.idStatVal}>{userProfile?.successful_responses || 0}</Text>
                 <Text style={styles.idStatLabel}>MISSIONS</Text>
               </View>
               <View style={styles.idStat}>
                 <Text style={styles.idStatVal}>5.0</Text>
                 <Text style={styles.idStatLabel}>RATING</Text>
               </View>
               <View style={styles.idStat}>
                 <Text style={styles.idStatVal}>Active</Text>
                 <Text style={styles.idStatLabel}>STATUS</Text>
               </View>
            </View>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContentResponder}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
        >
          
          {/* CERTIFICATIONS (Red Accents) */}
          <Text style={styles.sectionHeader}>Certifications</Text>
          <View style={styles.certCard}>
             <View style={styles.certRow}>
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                   <FontAwesome5 name="first-aid" size={18} color="#DC2626" />
                </View>
                <View style={{flex: 1}}>
                   <Text style={styles.certTitle}>Basic Life Support (BLS)</Text>
                   <Text style={styles.certSub}>Verified • Expires 2026</Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
             </View>
             <View style={[styles.certRow, { marginTop: 15 }]}>
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                   <FontAwesome5 name="heartbeat" size={18} color="#DC2626" />
                </View>
                <View style={{flex: 1}}>
                   <Text style={styles.certTitle}>CPR / AED Level 2</Text>
                   <Text style={styles.certSub}>Verified • Expires 2025</Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
             </View>
          </View>

          {/* SETTINGS */}
          <Text style={styles.sectionHeader}>Account & Settings</Text>
          <View style={styles.settingsCard}>
             <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('PrivacySecurity')}>
                <View style={styles.settingLeft}>
                    <Ionicons name="shield-outline" size={20} color="#334155" />
                    <Text style={[styles.settingText, {marginLeft: 10}]}>Security & Privacy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
             </TouchableOpacity>
             
             <View style={styles.divider} />

             <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('HelpSupport')}>
                <View style={styles.settingLeft}>
                    <Ionicons name="help-circle-outline" size={20} color="#334155" />
                    <Text style={[styles.settingText, {marginLeft: 10}]}>Responder Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
             </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
             <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{height: 40}} />
        </ScrollView>
      </View>
    );
  }

  // ============================================================
  //  RENDER: USER PROFILE (Red Theme)
  // ============================================================
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* RED HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>My Profile</Text>
          
          <TouchableOpacity onPress={() => Alert.alert("Edit", "Coming soon")}>
             <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        
        {/* USER CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
             <View style={styles.avatar}>
               <Text style={styles.avatarText}>{getInitials()}</Text>
             </View>
          </View>
          <Text style={styles.profileName}>{getDisplayName()}</Text>
          <Text style={styles.profilePhone}>{getDisplayPhone()}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>COMMUNITY MEMBER</Text>
          </View>
        </View>

        {/* MEDICAL ID */}
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

        {/* USER SETTINGS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Settings</Text>
          
          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('EmergencyContacts')}>
            <View style={styles.settingLeft}>
               <Ionicons name="people" size={20} color="#DC2626" />
               <Text style={[styles.settingText, {marginLeft: 10}]}>Emergency Contacts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
               <Ionicons name="notifications" size={20} color="#0284C7" />
               <Text style={[styles.settingText, {marginLeft: 10}]}>Push Notifications</Text>
            </View>
            <Switch 
              value={pushEnabled} 
              onValueChange={handleToggleNotifications} 
              trackColor={{false: '#E2E8F0', true: '#DC2626'}} 
              thumbColor="#fff" 
            />
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('PrivacySecurity')}>
            <View style={styles.settingLeft}>
               <Ionicons name="lock-closed" size={20} color="#9333EA" />
               <Text style={[styles.settingText, {marginLeft: 10}]}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

           <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('HelpSupport')}>
            <View style={styles.settingLeft}>
               <Ionicons name="help-circle" size={20} color="#D97706" />
               <Text style={[styles.settingText, {marginLeft: 10}]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
           <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // --- COMMON HEADER ---
  headerContainer: {
    backgroundColor: '#DC2626', // Overwritten for Responder
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    elevation: 4, zIndex: 10
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  backButton: { padding: 4 },

  scrollContent: { padding: 20, paddingBottom: 80 },
  scrollContentResponder: { padding: 20, paddingTop: 100 }, 

  // --- USER PROFILE STYLES ---
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
  profileName: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  profilePhone: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9' },
  roleText: { color: '#64748B', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // --- RESPONDER SPECIFIC STYLES ---
  responderIdCard: {
    position: 'absolute', top: 90, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: {width:0, height: 4}
  },
  idRow: { flexDirection: 'row', alignItems: 'center' },
  avatarRed: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', // Light Red
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  idName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  idRole: { fontSize: 10, fontWeight: '700', color: '#DC2626', letterSpacing: 1, marginTop: 2 },
  idPhone: { fontSize: 12, color: '#64748B', marginTop: 2 },
  idDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15 },
  idStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  idStat: { alignItems: 'center' },
  idStatVal: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  idStatLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },

  certCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 20, elevation: 2 },
  certRow: { flexDirection: 'row', alignItems: 'center' },
  certTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  certSub: { fontSize: 12, color: '#64748B' },

  settingsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 5, marginBottom: 20, elevation: 2 },
  
  // --- COMMON STYLES ---
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
  
  settingRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingVertical: 12, paddingHorizontal: 10
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingText: { fontSize: 15, fontWeight: '500', color: '#334155' },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 10 },

  signOutBtn: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});