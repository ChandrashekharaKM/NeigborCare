import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Linking
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const MedicalRecordsScreen = ({ navigation }: any) => {
  const { state: authState } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // --- FORM STATE ---
  const [bloodType, setBloodType] = useState('');
  const [age, setAge] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [medications, setMedications] = useState('');

  // Load existing data if available
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const profile = await apiService.getUserProfile(authState.user.id);
      if (profile) {
        setBloodType(profile.blood_type || '');
        setAge(profile.age ? profile.age.toString() : '');
        setAllergies(profile.allergies || '');
        setConditions(profile.medical_conditions || '');
        setMedications(profile.medications || '');
      }
    } catch (error) {
      console.log('Error fetching existing medical data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bloodType) {
      Alert.alert('Missing Info', 'Please select a Blood Type.');
      return;
    }

    setLoading(true);
    try {
      const medicalData = {
        blood_type: bloodType,
        age: age,
        allergies: allergies,
        medical_conditions: conditions,
        medications: medications
      };

      await apiService.updateUserProfile(authState.user.id, medicalData);

      Alert.alert('Success', 'Medical ID Updated Successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update medical records.');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>Update Medical ID</Text>
          <View style={{ width: 24 }} /> 
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Warning Card */}
          <View style={styles.warningCard}>
            <Ionicons name="information-circle" size={20} color="#B45309" />
            <Text style={styles.warningText}>
              This information will be shared with responders during an emergency.
            </Text>
          </View>

          {/* 1. BLOOD TYPE SELECTOR (RECTANGLES) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.label}>🩸 Blood Type <Text style={styles.required}>*</Text></Text>
            <View style={styles.bloodGrid}>
              {BLOOD_TYPES.map((type) => {
                const isSelected = bloodType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.bloodBox, // Changed from Bubble to Box
                      isSelected && styles.bloodBoxSelected
                    ]}
                    onPress={() => setBloodType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.bloodText,
                      isSelected && styles.bloodTextSelected
                    ]}>{type}</Text>
                    {isSelected && (
                      <View style={styles.checkMark}>
                        <Ionicons name="checkmark" size={12} color="#DC2626" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. AGE */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 24"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* 3. ALLERGIES */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allergies (Food, Drug, Latex)</Text>
            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: 10 }]}>
              <MaterialCommunityIcons name="allergy" size={20} color="#64748B" style={[styles.inputIcon, { marginTop: 4 }]} />
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="List any allergies..."
                multiline
                value={allergies}
                onChangeText={setAllergies}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* 4. MEDICAL CONDITIONS */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medical Conditions</Text>
            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: 10 }]}>
              <FontAwesome5 name="notes-medical" size={18} color="#64748B" style={[styles.inputIcon, { marginTop: 4 }]} />
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Diabetes, Asthma, Hypertension..."
                multiline
                value={conditions}
                onChangeText={setConditions}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* 5. MEDICATIONS */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Medications</Text>
            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: 10 }]}>
              <FontAwesome5 name="pills" size={18} color="#64748B" style={[styles.inputIcon, { marginTop: 4 }]} />
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="List current medications..."
                multiline
                value={medications}
                onChangeText={setMedications}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={{ height: 40 }} />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ================= SAVE BUTTON ================= */}
      <View style={styles.bottomActionContainer}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Medical ID</Text>
          )}
        </TouchableOpacity>
      </View>

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

  // --- HEADER ---
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

  scrollContent: { padding: 20, paddingBottom: 150 },

  // --- WARNING ---
  warningCard: {
    flexDirection: 'row', backgroundColor: '#FFFBEB', padding: 15, 
    borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#FCD34D',
    alignItems: 'center'
  },
  warningText: { flex: 1, marginLeft: 10, color: '#92400E', fontSize: 13, lineHeight: 18 },

  // --- SECTIONS ---
  sectionContainer: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 12 },
  required: { color: '#DC2626' },

  // --- BLOOD GRID (RECTANGLES) ---
  bloodGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', // Spreads them evenly
    gap: 12 
  },
  bloodBox: {
    width: '22%', // Fits 4 items per row
    paddingVertical: 14, // Makes it a rectangle (height)
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 10, // Soft corners for rectangle
    backgroundColor: '#fff', 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    elevation: 1, // Slight shadow
  },
  bloodBoxSelected: { 
    backgroundColor: '#FEF2F2', // Light red background
    borderColor: '#DC2626', // Strong red border
    elevation: 3
  },
  bloodText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  bloodTextSelected: { color: '#DC2626', fontWeight: '800' },
  checkMark: {
    position: 'absolute', top: 4, right: 4,
  },

  // --- INPUTS ---
  inputGroup: { marginBottom: 20 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15,
    elevation: 1
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1E293B' },

  // --- BOTTOM ACTION ---
  bottomActionContainer: {
    position: 'absolute', bottom: 50, left: 0, right: 0,
    padding: 20, backgroundColor: 'transparent'
  },
  saveButton: {
    backgroundColor: '#DC2626', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', elevation: 5, shadowColor: '#DC2626', shadowOpacity: 0.4, shadowRadius: 10
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // --- FOOTER ---
  footer: { 
    paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    position: 'absolute', bottom: 0, left: 0, right: 0 
  },
  footerLink: { color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
  footerDivider: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});