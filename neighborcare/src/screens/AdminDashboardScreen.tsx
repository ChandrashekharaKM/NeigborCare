import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { User } from '../types';

interface AdminDashboardScreenProps {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const { authContext } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [responders, setResponders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'users' | 'responders'>('users');

  // Load data on mount AND when tab changes (Re-render on toggle)
  useEffect(() => {
    loadData();
  }, [selectedTab]); 

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, respondersData] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getResponders(),
      ]);
      setUsers(usersData.users || []);
      setResponders(respondersData.responders || []);
    } catch (error: any) {
      console.error('Failed to load admin data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Do you want to sign out from Admin Dashboard?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', onPress: () => authContext.signOut() },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApproveResponder = async (userId: string) => {
    try {
      await apiService.approveResponder(userId);
      Alert.alert('Success', 'Responder approved');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.email}</Text>
          <Text style={styles.cardPhone}>📞 {item.phone_number}</Text>
        </View>
        <View style={[styles.badge, styles.userBadge]}>
          <Text style={styles.badgeText}>USER</Text>
        </View>
      </View>
    </View>
  );

  const renderResponderItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatarContainer, styles.responderAvatar]}>
          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || 'R'}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.email}</Text>
          <Text style={styles.cardPhone}>📞 {item.phone_number}</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Certified: </Text>
            <Text style={[styles.statusValue, (item as any).is_certified ? styles.textGreen : styles.textRed]}>
              {(item as any).is_certified ? 'Yes ✅' : 'No ❌'}
            </Text>
          </View>
        </View>
        <View style={[styles.badge, styles.responderBadge]}>
          <Text style={styles.badgeText}>RESPONDER</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {!(item as any).is_certified && (
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={() => handleApproveResponder(item.id)}
          >
            <Text style={styles.approveButtonText}>Manually Approve</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleSignOut} style={styles.backButton}>
             <Text style={styles.backButtonText}>← Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        {/* Name is updated to ADMIN, no email/phone shown */}
        <Text style={styles.title}>ADMIN</Text>
        <Text style={styles.subtitle}>Dashboard Control Panel</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'users' && styles.tabActive]}
          onPress={() => setSelectedTab('users')}
        >
          <Text style={[styles.tabText, selectedTab === 'users' && styles.tabTextActive]}>
            Users ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'responders' && styles.tabActive]}
          onPress={() => setSelectedTab('responders')}
        >
          <Text style={[styles.tabText, selectedTab === 'responders' && styles.tabTextActive]}>
            Responders ({responders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
        </View>
      ) : (
        <FlatList
          data={selectedTab === 'users' ? users : responders}
          renderItem={selectedTab === 'users' ? renderUserItem : renderResponderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No records found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTop: { marginBottom: 10 },
  backButton: { paddingVertical: 5 },
  backButtonText: { color: '#e74c3c', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '900', color: '#e74c3c', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#999', marginTop: 5 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  tabActive: { borderColor: '#e74c3c' },
  tabText: { fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#e74c3c' },
  listContainer: { padding: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  responderAvatar: { backgroundColor: '#e74c3c' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 14, color: '#666', marginBottom: 2 },
  cardPhone: { fontSize: 14, color: '#666', marginBottom: 5 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  userBadge: { backgroundColor: '#ebf5fb' },
  responderBadge: { backgroundColor: '#fdedec' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusLabel: { fontSize: 12, color: '#888' },
  statusValue: { fontSize: 12, fontWeight: '600' },
  textGreen: { color: 'green' },
  textRed: { color: 'red' },
  actionContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  approveButton: { backgroundColor: '#27ae60', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 6 },
  approveButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#999', fontSize: 16 },
});