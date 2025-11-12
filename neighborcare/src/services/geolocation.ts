import * as Location from 'expo-location';
import { LocationData } from '../types';

class GeolocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  async requestLocationPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startLocationTracking(
    onLocationUpdate: (location: LocationData) => void,
    intervalMs: number = 5000
  ) {
    try {
      const permitted = await this.requestLocationPermissions();
      if (!permitted) {
        console.warn('Location permissions not granted');
        return;
      }

      // Update location immediately
      const location = await this.getCurrentLocation();
      if (location) {
        onLocationUpdate(location);
      }

      // Set up interval for periodic updates
      this.updateInterval = setInterval(async () => {
        const location = await this.getCurrentLocation();
        if (location) {
          onLocationUpdate(location);
        }
      }, intervalMs);
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  stopLocationTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  // Calculate distance between two points in meters
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Convert to meters
    return Math.round(distance);
  }

  // Format distance for display
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  // Calculate estimated arrival time in minutes
  calculateETA(distanceInMeters: number, speedKmh: number = 5): number {
    const distanceInKm = distanceInMeters / 1000;
    const timeInHours = distanceInKm / speedKmh;
    return Math.ceil(timeInHours * 60);
  }
}

export default new GeolocationService();
