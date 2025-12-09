import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

export const PrivacySecurityScreen = ({ navigation }: any) => {
  const { state: authState, authContext } = useAuth();
  
  // --- STATE ---
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [shareMedicalData, setShareMedicalData] = useState(true);

  // Password Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsSupported(compatible && enrolled);

      const savedBio = await AsyncStorage.getItem('biometric_enabled');
      if (savedBio === 'true') setIsBiometricEnabled(true);
    })();
  }, []);

  // --- ACTIONS ---
  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Identity',
      });
      if (result.success) {
        setIsBiometricEnabled(true);
        await AsyncStorage.setItem('biometric_enabled', 'true');
      } else {
        setIsBiometricEnabled(false);
      }
    } else {
      setIsBiometricEnabled(false);
      await AsyncStorage.setItem('biometric_enabled', 'false');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (authState.user) {
        await apiService.changePassword(authState.user.id, oldPassword, newPassword);
        Alert.alert("Success", "Password updated successfully.");
        setModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      Alert.alert("Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
             // Call delete API here
             authContext.signOut();
          } 
        }
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert("Error", "Cannot open link"));
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={{ width: 24 }} /> 
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- ACCOUNT SECURITY --- */}
        <Text style={styles.sectionTitle}>Account Security</Text>
        <View style={styles.card}>
          
          <TouchableOpacity style={styles.rowItem} onPress={() => setModalVisible(true)}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="key-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.rowText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {isSupported && (
            <>
              <View style={styles.divider} />
              <View style={styles.rowItem}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="finger-print" size={20} color="#16A34A" />
                  </View>
                  <View>
                    <Text style={styles.rowText}>Biometric Login</Text>
                    <Text style={styles.rowSubText}>FaceID / TouchID</Text>
                  </View>
                </View>
                <Switch 
                  value={isBiometricEnabled} 
                  onValueChange={handleToggleBiometric}
                  trackColor={{ false: '#E2E8F0', true: '#16A34A' }}
                  thumbColor="#fff"
                />
              </View>
            </>
          )}
        </View>

        {/* --- DATA SHARING --- */}
        <Text style={styles.sectionTitle}>Data Sharing</Text>
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="location-outline" size={20} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.rowText}>Share Real-time Location</Text>
                <Text style={styles.rowSubText}>Only during SOS</Text>
              </View>
            </View>
            <Switch 
              value={shareLocation} 
              onValueChange={setShareLocation}
              trackColor={{ false: '#E2E8F0', true: '#DC2626' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <FontAwesome5 name="file-medical-alt" size={18} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.rowText}>Share Medical ID</Text>
                <Text style={styles.rowSubText}>With Responders</Text>
              </View>
            </View>
            <Switch 
              value={shareMedicalData} 
              onValueChange={setShareMedicalData}
              trackColor={{ false: '#E2E8F0', true: '#EA580C' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* --- LEGAL --- */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
           <TouchableOpacity style={styles.rowItem} onPress={() => openLink('https://policies.google.com/privacy')}>
              <Text style={styles.rowTextSimple}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={18} color="#94A3B8" />
           </TouchableOpacity>
           <View style={styles.divider} />
           <TouchableOpacity style={styles.rowItem} onPress={() => openLink('https://policies.google.com/terms')}>
              <Text style={styles.rowTextSimple}>Terms of Service</Text>
              <Ionicons name="open-outline" size={18} color="#94A3B8" />
           </TouchableOpacity>
        </View>

        {/* --- DELETE --- */}
        <View style={styles.dangerContainer}>
           <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
             <MaterialIcons name="delete-forever" size={24} color="#DC2626" />
             <Text style={styles.deleteText}>Delete My Account</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>

      {/* --- PASSWORD MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Old Password</Text>
              <TextInput 
                style={styles.input} 
                secureTextEntry 
                value={oldPassword} 
                onChangeText={setOldPassword}
                placeholder="Enter current password"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput 
                style={styles.input} 
                secureTextEntry 
                value={newPassword} 
                onChangeText={setNewPassword}
                placeholder="Enter new password"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput 
                style={styles.input} 
                secureTextEntry 
                value={confirmPassword} 
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0, elevation: 4, zIndex: 10
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  backButton: { padding: 4 },
  scrollContent: { padding: 20, paddingBottom: 80 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 10, marginLeft: 4, textTransform: 'uppercase' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowText: { fontSize: 16, fontWeight: '500', color: '#1E293B' },
  rowSubText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  rowTextSimple: { fontSize: 15, color: '#334155' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  dangerContainer: { marginTop: 10, alignItems: 'center' },
  deleteButton: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingVertical: 14, 
    paddingHorizontal: 30, borderRadius: 50, borderWidth: 1, borderColor: '#FECACA' 
  },
  deleteText: { color: '#DC2626', fontWeight: '700', fontSize: 15, marginLeft: 8 },
  
  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 16, color: '#1E293B', backgroundColor: '#F8FAFC' },
  saveBtn: { backgroundColor: '#DC2626', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});