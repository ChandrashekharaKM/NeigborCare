import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import geolocationService from '../services/geolocation';
import apiService from '../services/api';
import { LocationData } from '../types';

interface Resource {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  phone?: string;
  address?: string;
  is_24_hours?: boolean;
  distance?: number;
}

interface NearbyResourcesScreenProps {
  navigation: any;
}

export const NearbyResourcesScreen: React.FC<NearbyResourcesScreenProps> = ({
  navigation,
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hospital' | 'pharmacy' | 'clinic'>('all');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Get current location
      const currentLocation = await geolocationService.getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        await loadNearbyResources(currentLocation);
      }
    } catch (error) {
      console.error('Error initializing screen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyResources = async (loc: LocationData) => {
    try {
      const response = await apiService.getNearbyResources(
        loc.latitude,
        loc.longitude,
        5000 // 5km radius
      );

      // Calculate distances
      const resourcesWithDistance = response.resources.map((res: Resource) => {
        const distance = geolocationService.calculateDistance(
          loc.latitude,
          loc.longitude,
          res.latitude,
          res.longitude
        );
        return { ...res, distance };
      });

      setResources(resourcesWithDistance);
    } catch (error) {
      console.error('Error loading resources:', error);
      // Use mock data for demo
      setResources(getMockResources());
    }
  };

  const getMockResources = () => [
    {
      id: '1',
      name: 'Central Hospital',
      type: 'hospital',
      latitude: 40.7128,
      longitude: -74.006,
      phone: '+1-555-0100',
      address: '123 Main St',
      is_24_hours: true,
      distance: 450,
    },
    {
      id: '2',
      name: 'City Clinic',
      type: 'clinic',
      latitude: 40.715,
      longitude: -74.008,
      phone: '+1-555-0101',
      address: '456 Oak Ave',
      is_24_hours: false,
      distance: 650,
    },
    {
      id: '3',
      name: '24/7 Pharmacy',
      type: 'pharmacy',
      latitude: 40.71,
      longitude: -74.005,
      phone: '+1-555-0102',
      address: '789 Elm Rd',
      is_24_hours: true,
      distance: 380,
    },
    {
      id: '4',
      name: 'Emergency Care Center',
      type: 'hospital',
      latitude: 40.705,
      longitude: -74.012,
      phone: '+1-555-0103',
      address: '321 Pine Ln',
      is_24_hours: true,
      distance: 1200,
    },
  ];

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'hospital':
        return '🏥';
      case 'clinic':
        return '⚕️';
      case 'pharmacy':
        return '💊';
      default:
        return '🏢';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getFilteredAndSortedResources = () => {
    let filtered = resources;

    if (filter !== 'all') {
      filtered = resources.filter((r) => r.type === filter);
    }

    if (sortBy === 'distance') {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    Alert.alert(
      'Call',
      `Call ${phone}?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${phone}`),
        },
      ]
    );
  };

  const handleDirections = (lat: number, lon: number) => {
    const url = `geo:${lat},${lon}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open directions');
    });
  };

  const renderResourceCard = ({ item }: { item: Resource }) => (
    <View style={styles.resourceCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.typeEmoji}>{getTypeEmoji(item.type)}</Text>
          <View style={styles.titleContent}>
            <Text style={styles.resourceName}>{item.name}</Text>
            <Text style={styles.resourceType}>{getTypeLabel(item.type)}</Text>
          </View>
        </View>
        {item.is_24_hours && (
          <View style={styles.badgeOpen24}>
            <Text style={styles.badge24Text}>24/7</Text>
          </View>
        )}
      </View>

      {item.distance !== undefined && (
        <View style={styles.distanceContainer}>
          <Text style={styles.distance}>
            📍 {geolocationService.formatDistance(item.distance)} away
          </Text>
        </View>
      )}

      {item.address && (
        <Text style={styles.address}>{item.address}</Text>
      )}

      <View style={styles.actionButtons}>
        {item.phone && (
          <TouchableOpacity
            style={styles.actionButton}
              onPress={() => handleCall(item.phone!)}
          >
            <Text style={styles.actionButtonEmoji}>📞</Text>
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDirections(item.latitude, item.longitude)}
        >
          <Text style={styles.actionButtonEmoji}>🗺️</Text>
          <Text style={styles.actionButtonText}>Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonEmoji}>⭐</Text>
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredResources = getFilteredAndSortedResources();

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
        <Text style={styles.title}>Nearby Resources</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter and Sort */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.controlsContainer}
        contentContainerStyle={styles.controlsContent}
      >
        {/* Type Filters */}
        {['all', 'hospital', 'clinic', 'pharmacy'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              filter === type && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(type as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === type && styles.filterButtonTextActive,
              ]}
            >
              {type === 'all' ? '📍 All' : getTypeEmoji(type) + ' ' + getTypeLabel(type)}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Sort Options */}
        <View style={styles.divider} />

        {['distance', 'name'].map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[
              styles.filterButton,
              sortBy === sort && styles.filterButtonActive,
            ]}
            onPress={() => setSortBy(sort as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                sortBy === sort && styles.filterButtonTextActive,
              ]}
            >
              {sort === 'distance' ? '📏 Distance' : '📝 Name'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Resources List */}
      {filteredResources.length > 0 ? (
        <FlatList
          data={filteredResources}
          renderItem={renderResourceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No Resources Found</Text>
          <Text style={styles.emptySubtitle}>
            Try changing filters or expanding search radius
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
  controlsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  controlsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
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
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#ddd',
    marginHorizontal: 6,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  resourceCard: {
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
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  resourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resourceType: {
    fontSize: 12,
    color: '#999',
  },
  badgeOpen24: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badge24Text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  distanceContainer: {
    marginBottom: 8,
  },
  distance: {
    fontSize: 13,
    color: '#e74c3c',
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  actionButtonEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e74c3c',
    textAlign: 'center',
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
