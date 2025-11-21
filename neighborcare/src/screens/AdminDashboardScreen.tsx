import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { User } from '../types';

interface AdminDashboardScreenProps {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const { state: authState } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [responders, setResponders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'users' | 'responders'>('users');

  useEffect(() => {
    loadData();
  }, []);

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
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveResponder = async (userId: string) => {
    Alert.alert(
      'Approve Responder',
      'Are you sure you want to approve this responder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await apiService.approveResponder(userId);
              Alert.alert('Success', 'Responder approved successfully');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve responder');
            }
          },
        },
      ]
    );
  };

  const handleViewProfile = (user: User) => {
    navigation.navigate('UserProfile', { userId: user.id });
  };

  const handleConductExam = (userId: string) => {
    navigation.navigate('ConductExam', { userId });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage Users & Responders</Text>
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {selectedTab === 'users' ? (
            users.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : (
              users.map((user) => (
                <View key={user.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{user.name}</Text>
                      <Text style={styles.cardSubtitle}>{user.email || user.phone_number}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>USER</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleViewProfile(user)}
                    >
                      <Text style={styles.actionButtonText}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : (
            responders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No responders found</Text>
              </View>
            ) : (
              responders.map((responder) => (
                <View key={responder.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{responder.name}</Text>
                      <Text style={styles.cardSubtitle}>
                        {responder.email || responder.phone_number}
                      </Text>
                      <Text style={styles.cardInfo}>
                        Certified: {(responder as any).is_certified ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={[styles.badge, styles.responderBadge]}>
                      <Text style={styles.badgeText}>RESPONDER</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleViewProfile(responder)}
                    >
                      <Text style={styles.actionButtonText}>View Profile</Text>
                    </TouchableOpacity>
                    {!(responder as any).is_certified && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.examButton]}
                        onPress={() => handleConductExam(responder.id)}
                      >
                        <Text style={styles.actionButtonText}>Conduct Exam</Text>
                      </TouchableOpacity>
                    )}
                    {(responder as any).is_certified && !(responder as any).exam_passed && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveResponder(responder.id)}
                      >
                        <Text style={styles.actionButtonText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#e74c3c',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#e74c3c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cardInfo: {
    fontSize: 12,
    color: '#999',
  },
  badge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  responderBadge: {
    backgroundColor: '#e74c3c',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  examButton: {
    backgroundColor: '#f39c12',
  },
  approveButton: {
    backgroundColor: '#27ae60',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

