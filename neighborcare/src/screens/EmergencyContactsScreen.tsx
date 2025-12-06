import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Platform,
  StatusBar,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
// import apiService from '../services/api'; // Uncomment when backend is ready

// Mock Data for UI testing
const MOCK_CONTACTS = [
  { id: '1', name: 'Mom', phone: '9876543210', relationship: 'Parent' },
  { id: '2', name: 'Dr. Smith', phone: '1234567890', relationship: 'Doctor' },
];

export const EmergencyContactsScreen = ({ navigation }: any) => {
  const { state: authState } = useAuth();
  const [contacts, setContacts] = useState<any[]>(MOCK_CONTACTS);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // New Contact Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('Family');

  const RELATIONSHIPS = ['Family', 'Friend', 'Spouse', 'Doctor', 'Other'];

  const handleAddContact = () => {
    if (!newName || !newPhone) {
      Alert.alert('Missing Info', 'Please enter a name and phone number.');
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: newName,
      phone: newPhone,
      relationship: newRelation
    };

    // UI Update (Optimistic)
    setContacts([...contacts, newContact]);
    
    // Reset Form
    setNewName('');
    setNewPhone('');
    setModalVisible(false);

    // TODO: Call API to save to backend
    // await apiService.addEmergencyContact(authState.user.id, newContact);
  };

  const handleDeleteContact = (id: string) => {
    Alert.alert(
      "Remove Contact",
      "Are you sure you want to remove this contact?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => {
             setContacts(contacts.filter(c => c.id !== id));
             // TODO: Call API to delete
          }
        }
      ]
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
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
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <View style={{ width: 24 }} /> 
        </View>
      </View>

      <View style={styles.contentContainer}>
        
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={20} color="#166534" />
          <Text style={styles.infoText}>
            These contacts will be notified automatically when you press SOS.
          </Text>
        </View>

        {/* Contacts List */}
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.contactCard}>
              <View style={styles.contactLeft}>
                <View style={styles.avatar}>
                   <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <View style={styles.relationBadge}>
                    <Text style={styles.relationText}>{item.relationship}</Text>
                  </View>
                  <Text style={styles.contactPhone}>{item.phone}</Text>
                </View>
              </View>

              <View style={styles.contactActions}>
                <TouchableOpacity 
                  style={styles.iconBtn} 
                  onPress={() => handleCall(item.phone)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="call" size={18} color="#16A34A" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.iconBtn} 
                  onPress={() => handleDeleteContact(item.id)}
                >
                   <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No contacts added yet.</Text>
              <Text style={styles.emptySub}>Add family or friends to keep them informed.</Text>
            </View>
          }
        />

      </View>

      {/* ================= FAB (ADD BUTTON) ================= */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="person-add" size={24} color="#fff" />
        <Text style={styles.fabText}>Add Contact</Text>
      </TouchableOpacity>

      {/* ================= ADD CONTACT MODAL ================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Emergency Contact</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. John Doe" 
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. 9876543210" 
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship</Text>
              <View style={styles.chipRow}>
                {RELATIONSHIPS.map((rel) => (
                  <TouchableOpacity 
                    key={rel}
                    style={[styles.chip, newRelation === rel && styles.chipSelected]}
                    onPress={() => setNewRelation(rel)}
                  >
                    <Text style={[styles.chipText, newRelation === rel && styles.chipTextSelected]}>
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddContact}>
              <Text style={styles.saveBtnText}>Save Contact</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

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
  
  // Header
  headerContainer: {
    backgroundColor: '#DC2626',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    paddingBottom: 20, paddingHorizontal: 20,
    elevation: 4, zIndex: 10
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  backButton: { padding: 4 },

  contentContainer: { flex: 1, padding: 20 },

  // Info Banner
  infoBanner: {
    flexDirection: 'row', backgroundColor: '#DCFCE7', padding: 12, borderRadius: 12,
    marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#86EFAC'
  },
  infoText: { marginLeft: 10, color: '#14532D', fontSize: 13, flex: 1 },

  // Contact Card
  contactCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  contactLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#64748B' },
  contactName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  contactPhone: { fontSize: 13, color: '#64748B', marginTop: 2 },
  relationBadge: { 
    backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 6, 
    paddingVertical: 2, borderRadius: 4, marginVertical: 2 
  },
  relationText: { fontSize: 10, fontWeight: '600', color: '#2563EB' },
  
  contactActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 4 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#94A3B8', marginTop: 10 },
  emptySub: { fontSize: 14, color: '#CBD5E1', marginTop: 5 },

  // FAB
  fab: {
    position: 'absolute', bottom: 80, right: 20,
    backgroundColor: '#DC2626', flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30,
    elevation: 6, shadowColor: '#DC2626', shadowOpacity: 0.4, shadowOffset: {width: 0, height: 4}
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  input: { 
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, 
    padding: 14, fontSize: 16, color: '#1E293B', backgroundColor: '#F8FAFC' 
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { 
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, 
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff' 
  },
  chipSelected: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  chipText: { fontSize: 13, color: '#64748B' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },

  saveBtn: { 
    backgroundColor: '#DC2626', padding: 16, borderRadius: 16, 
    alignItems: 'center', marginTop: 10, marginBottom: 20 
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Footer
  footer: { 
    paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    position: 'absolute', bottom: 0, left: 0, right: 0 
  },
  footerLink: { color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 },
  footerDivider: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});