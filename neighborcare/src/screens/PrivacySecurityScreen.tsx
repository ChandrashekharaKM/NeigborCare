import React, { useState } from 'react';
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
  Linking
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export const PrivacySecurityScreen = ({ navigation }: any) => {
  // --- STATE ---
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [shareMedicalData, setShareMedicalData] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This action cannot be undone and you will lose all medical records.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Forever", 
          style: "destructive", 
          onPress: () => console.log("Delete Account Logic") 
        }
      ]
    );
  };

  const handleToggleBiometric = (val: boolean) => {
    setIsBiometricEnabled(val);
    if (val) Alert.alert("Biometrics", "FaceID / Fingerprint enabled for next login.");
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ================= HEADER ================= */}
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
        
        {/* --- SECTION 1: ACCOUNT SECURITY --- */}
        <Text style={styles.sectionTitle}>Account Security</Text>
        <View style={styles.card}>
          
          {/* Change Password */}
          <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert("Reset", "Password reset link sent to email.")}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="key-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.rowText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Biometric Login */}
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
        </View>

        {/* --- SECTION 2: DATA & PRIVACY --- */}
        <Text style={styles.sectionTitle}>Data Sharing</Text>
        <View style={styles.card}>
          
          {/* Location Sharing */}
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="location-outline" size={20} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.rowText}>Share Real-time Location</Text>
                <Text style={styles.rowSubText}>Only during SOS emergencies</Text>
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

          {/* Medical Data Sharing */}
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <FontAwesome5 name="file-medical-alt" size={18} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.rowText}>Share Medical ID</Text>
                <Text style={styles.rowSubText}>With Ambulance/Responders</Text>
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

        {/* --- SECTION 3: LEGAL --- */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
           <TouchableOpacity style={styles.rowItem}>
              <Text style={styles.rowTextSimple}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={18} color="#94A3B8" />
           </TouchableOpacity>
           <View style={styles.divider} />
           <TouchableOpacity style={styles.rowItem}>
              <Text style={styles.rowTextSimple}>Terms of Service</Text>
              <Ionicons name="open-outline" size={18} color="#94A3B8" />
           </TouchableOpacity>
        </View>

        {/* --- DANGER ZONE --- */}
        <View style={styles.dangerContainer}>
           <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
             <MaterialIcons name="delete-forever" size={24} color="#DC2626" />
             <Text style={styles.deleteText}>Delete My Account</Text>
           </TouchableOpacity>
           <Text style={styles.dangerSubText}>
             Permanently delete your account and all associated medical data.
           </Text>
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

  // HEADER
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

  // SECTIONS
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 10, marginLeft: 4, textTransform: 'uppercase' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  
  // ROWS
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowText: { fontSize: 16, fontWeight: '500', color: '#1E293B' },
  rowSubText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  rowTextSimple: { fontSize: 15, color: '#334155' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },

  // DANGER ZONE
  dangerContainer: { marginTop: 10, alignItems: 'center' },
  deleteButton: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#FEF2F2', paddingVertical: 14, paddingHorizontal: 30, 
    borderRadius: 50, borderWidth: 1, borderColor: '#FECACA' 
  },
  deleteText: { color: '#DC2626', fontWeight: '700', fontSize: 15, marginLeft: 8 },
  dangerSubText: { color: '#94A3B8', fontSize: 12, marginTop: 12, textAlign: 'center', width: '80%' },

  // FOOTER
  footer: { 
    paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    position: 'absolute', bottom: 0, left: 0, right: 0 
  },
  footerLink: { color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
  footerDivider: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});