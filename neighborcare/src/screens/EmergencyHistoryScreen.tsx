import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Emergency } from '../types';

interface EmergencyHistoryScreenProps {
  navigation: any;
}

export const EmergencyHistoryScreen: React.FC<EmergencyHistoryScreenProps> = ({
  navigation,
}) => {
  const { state: authState } = useAuth();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'resolved' | 'pending'>('all');

  useEffect(() => {
    loadEmergencyHistory();
  }, []);

  const loadEmergencyHistory = async () => {
    try {
      if (authState.user) {
        const history = await apiService.getUserEmergencyHistory(authState.user.id);
        setEmergencies(history.emergencies || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEmergencies = () => {
    if (filter === 'all') return emergencies;
    return emergencies.filter((e) => e.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#4caf50';
      case 'in-progress':
        return '#ffc107';
      case 'pending':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'resolved':
        return '✓';
      case 'in-progress':
        return '⚡';
      case 'pending':
        return '⏳';
      default:
        return '?';
    }
  };

  const getEmergencyEmoji = (type: string) => {
    switch (type) {
      case 'Cardiac':
        return '❤️';
      case 'Bleeding':
        return '🩸';
      case 'Choking':
        return '🫁';
      case 'Fracture':
        return '🦴';
      default:
        return '🚑';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderEmergencyCard = ({ item }: { item: Emergency }) => (
    <TouchableOpacity
      style={styles.emergencyCard}
      onPress={() =>
        navigation.navigate('EmergencyDetail', { emergencyId: item.id })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeEmoji}>{getEmergencyEmoji(item.emergency_type)}</Text>
          <Text style={styles.type}>{item.emergency_type}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusEmoji}>{getStatusEmoji(item.status)}</Text>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.location}>
          📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>

      {item.description && (
        <View style={styles.cardDescription}>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      )}

      {item.resolved_at && (
        <View style={styles.cardFooter}>
          <Text style={styles.resolvedTime}>
            Resolved: {formatDate(item.resolved_at)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const filteredEmergencies = getFilteredEmergencies();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All ({emergencies.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'resolved' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('resolved')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'resolved' && styles.filterButtonTextActive,
            ]}
          >
            Resolved ({emergencies.filter((e) => e.status === 'resolved').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'pending' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'pending' && styles.filterButtonTextActive,
            ]}
          >
            Pending ({emergencies.filter((e) => e.status === 'pending').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Emergency List */}
      {filteredEmergencies.length > 0 ? (
        <FlatList
          data={filteredEmergencies}
          renderItem={renderEmergencyCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No Emergencies</Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'all'
              ? 'You have no recorded emergencies yet.'
              : `No ${filter} emergencies found.`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#e74c3c',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  emergencyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    marginBottom: 10,
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  cardDescription: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  cardFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resolvedTime: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
