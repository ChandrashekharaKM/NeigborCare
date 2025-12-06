import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, FlatList,
  RefreshControl, Platform, StatusBar, ScrollView, TextInput, Modal, Linking
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { User } from '../types';

interface AdminDashboardScreenProps {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const { authContext } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'responders' | 'users' | 'exams'>('overview');
  
  const [users, setUsers] = useState<User[]>([]);
  const [responders, setResponders] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalResponders: 0, pendingApprovals: 0 });
  
  // Real Exam State
  const [questions, setQuestions] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newAns, setNewAns] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, respondersData, examQuestions] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getResponders(),
        apiService.getExamQuestions(),
      ]);
      
      const userList = usersData.users || [];
      const responderList = respondersData.responders || [];

      setUsers(userList);
      setResponders(responderList);
      setQuestions(examQuestions);
      
      setStats({
        totalUsers: userList.length,
        totalResponders: responderList.length,
        pendingApprovals: responderList.filter((r: any) => !r.is_certified).length
      });

    } catch (error: any) {
      console.error('Failed to load admin data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Exit Admin Dashboard?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => authContext.signOut() },
    ]);
  };

  const handleApproveResponder = async (userId: string) => {
    try {
      await apiService.approveResponder(userId);
      Alert.alert('Success', 'Responder Approved & Certified ✅');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve');
    }
  };

  // ✅ NEW: Real API Calls for Questions
  const handleAddQuestion = async () => {
    if (!newQ || !newAns) return alert("Fill all fields");
    try {
      const updatedList = await apiService.addExamQuestion(newQ, newAns);
      setQuestions(updatedList);
      setModalVisible(false);
      setNewQ('');
      setNewAns('');
      Alert.alert("Success", "Question added to Database");
    } catch (error) {
      Alert.alert("Error", "Could not add question");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
        const updatedList = await apiService.deleteExamQuestion(id);
        setQuestions(updatedList);
    } catch (error) {
        Alert.alert("Error", "Could not delete question");
    }
  };

  // --- RENDERERS ---

  const renderOverview = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
           <FontAwesome5 name="users" size={24} color="#2563EB" />
           <Text style={[styles.statVal, { color: '#2563EB' }]}>{stats.totalUsers}</Text>
           <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
           <FontAwesome5 name="ambulance" size={24} color="#DC2626" />
           <Text style={[styles.statVal, { color: '#DC2626' }]}>{stats.totalResponders}</Text>
           <Text style={styles.statLabel}>Responders</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
           <FontAwesome5 name="user-clock" size={24} color="#EA580C" />
           <Text style={[styles.statVal, { color: '#EA580C' }]}>{stats.pendingApprovals}</Text>
           <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
           <FontAwesome5 name="check-circle" size={24} color="#16A34A" />
           <Text style={[styles.statVal, { color: '#16A34A' }]}>Good</Text>
           <Text style={styles.statLabel}>System Status</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderResponderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.avatar, { backgroundColor: '#FEE2E2' }]}>
           <Text style={[styles.avatarText, { color: '#DC2626' }]}>{item.name?.[0]}</Text>
        </View>
        <View style={{flex: 1}}>
           <Text style={styles.cardName}>{item.name}</Text>
           <Text style={styles.cardEmail}>{item.email}</Text>
           <View style={{flexDirection:'row', marginTop: 4}}>
              {item.is_certified ? (
                  <View style={styles.tagGreen}><Text style={styles.tagTextGreen}>Certified</Text></View>
              ) : (
                  <View style={styles.tagOrange}><Text style={styles.tagTextOrange}>Pending</Text></View>
              )}
           </View>
        </View>
        {!item.is_certified && (
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveResponder(item.id)}>
                <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderExamItem = ({ item }: { item: any }) => (
     <View style={styles.card}>
        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
           <Text style={styles.qText}>Q: {item.question}</Text>
           <TouchableOpacity onPress={() => handleDeleteQuestion(item.id)}>
               <Ionicons name="trash-outline" size={20} color="#DC2626" />
           </TouchableOpacity>
        </View>
        <Text style={styles.aText}>Correct Answer: {item.note || item.options?.[item.correctAnswer] || item.option}</Text>
     </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* TAB BAR */}
        <View style={styles.tabBar}>
           {['overview', 'responders', 'users', 'exams'].map((tab) => (
             <TouchableOpacity 
                key={tab} 
                style={[styles.tabItem, selectedTab === tab && styles.tabItemActive]}
                onPress={() => setSelectedTab(tab as any)}
             >
                <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
             </TouchableOpacity>
           ))}
        </View>
      </View>

      {/* BODY */}
      <View style={styles.contentContainer}>
         {loading ? (
            <ActivityIndicator size="large" color="#DC2626" style={{marginTop: 50}} />
         ) : (
            <>
               {selectedTab === 'overview' && renderOverview()}

               {selectedTab === 'responders' && (
                 <FlatList
                    data={responders}
                    renderItem={renderResponderItem}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                 />
               )}

               {selectedTab === 'users' && (
                 <FlatList
                    data={users}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardRow}>
                                <View style={[styles.avatar, { backgroundColor: '#E0F2FE' }]}>
                                    <Text style={[styles.avatarText, { color: '#0284C7' }]}>{item.name?.[0]}</Text>
                                </View>
                                <View>
                                    <Text style={styles.cardName}>{item.name}</Text>
                                    <Text style={styles.cardEmail}>{item.email}</Text>
                                    <Text style={styles.cardPhone}>{item.phone_number}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                 />
               )}

               {selectedTab === 'exams' && (
                  <View style={{flex:1}}>
                     <TouchableOpacity style={styles.addQBtn} onPress={() => setModalVisible(true)}>
                        <Text style={styles.addQText}>+ Add New Question</Text>
                     </TouchableOpacity>
                     <FlatList
                        data={questions}
                        renderItem={renderExamItem}
                        keyExtractor={item => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#999'}}>No questions yet.</Text>}
                     />
                  </View>
               )}
            </>
         )}
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Add Exam Question</Text>
               <TextInput 
                  style={styles.input} 
                  placeholder="Enter Question..." 
                  value={newQ} 
                  onChangeText={setNewQ} 
               />
               <TextInput 
                  style={styles.input} 
                  placeholder="Correct Answer (Option A)..." 
                  value={newAns} 
                  onChangeText={setNewAns} 
               />
               <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                     <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAddQuestion} style={styles.saveBtn}>
                     <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

      {/* FOOTER */}
      <View style={[styles.footer, { backgroundColor: '#DC2626' }]}>
        <TouchableOpacity onPress={() => Linking.openURL('tel:108')}>
          <Text style={styles.footerLink}>System Status: Online</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: {
    backgroundColor: '#DC2626',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    paddingBottom: 0,
    elevation: 4, zIndex: 10
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)' },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#fff' },
  tabText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  contentContainer: { flex: 1, padding: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', padding: 15, borderRadius: 12, marginBottom: 15, alignItems: 'center', elevation: 1 },
  statVal: { fontSize: 24, fontWeight: '800', marginVertical: 5 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontWeight: 'bold', fontSize: 16 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardEmail: { fontSize: 12, color: '#64748B' },
  cardPhone: { fontSize: 11, color: '#94A3B8' },
  tagGreen: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagTextGreen: { color: '#166534', fontSize: 10, fontWeight: '700' },
  tagOrange: { backgroundColor: '#FFEDD5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagTextOrange: { color: '#9A3412', fontSize: 10, fontWeight: '700' },
  approveBtn: { backgroundColor: '#22C55E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  approveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addQBtn: { backgroundColor: '#DC2626', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  addQText: { color: '#fff', fontWeight: 'bold' },
  qText: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5, flex: 1 },
  aText: { fontSize: 13, color: '#16A34A', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#666' },
  saveBtn: { backgroundColor: '#DC2626', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  saveText: { color: '#fff', fontWeight: 'bold' },
  footer: { paddingVertical: 10, alignItems: 'center', position: 'absolute', bottom: 0, left: 0, right: 0 },
  footerLink: { color: '#fff', fontSize: 10, fontWeight: '700' },
});