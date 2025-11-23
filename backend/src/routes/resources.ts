import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// Helper: Calculate distance between two points in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000);
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// GET /api/resources/nearby
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const rad = Number(radius) || 3000; // Default 3km radius

    // --- LIVE QUERY TO OPENSTREETMAP ---
    // Searching for: Hospitals, Clinics, Doctors, Pharmacies, Police, Fire Stations
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"hospital|clinic|doctors|pharmacy|police|fire_station"](around:${rad},${lat},${lon});
      );
      out body;
    `;

    const osmUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    console.log(`Fetching REAL data for location: ${lat}, ${lon}`);
    
    const response = await axios.get(osmUrl);
    const data = response.data.elements;

    if (!data || data.length === 0) {
        console.log("No real resources found near this location.");
        return res.json({ resources: [] });
    }

    // --- FORMAT REAL DATA ---
    const resources = data.map((element: any) => {
      const tags = element.tags || {};
      const facilityLat = element.lat;
      const facilityLon = element.lon;
      const dist = getDistanceFromLatLonInM(lat, lon, facilityLat, facilityLon);

      // Build proper address string
      let address = "Address details unavailable";
      if (tags['addr:full']) {
        address = tags['addr:full'];
      } else if (tags.vicinity) {
        address = tags.vicinity;
      } else if (tags['addr:street']) {
        address = `${tags['addr:housenumber'] || ''} ${tags['addr:street']}, ${tags['addr:city'] || ''}`;
      }

      // Fix naming if name is missing
      let type = tags.amenity || 'hospital';
      if (type === 'doctors') type = 'clinic';
      
      const name = tags.name || `${type.charAt(0).toUpperCase() + type.slice(1)} (Unnamed)`;

      return {
        id: `osm_${element.id}`,
        name: name,
        type: type,
        latitude: facilityLat,
        longitude: facilityLon,
        phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null,
        address: address,
        is_24_hours: tags.opening_hours === '24/7',
        distance: dist,
      };
    });

    // Sort by distance (closest first)
    resources.sort((a: any, b: any) => a.distance - b.distance);
    
    // Limit to top 10 to avoid overwhelming the list
    const topResources = resources.slice(0, 10);

    console.log(`Found ${resources.length} facilities. Returning closest ${topResources.length}.`);
    
    res.json({ resources: topResources });

  } catch (error) {
    console.error('Error fetching from OpenStreetMap:', error);
    // Return empty array instead of crashing
    res.json({ resources: [] });
  }
});

export default router;