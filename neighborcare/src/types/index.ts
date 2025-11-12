export interface User {
  id: string;
  phone_number: string;
  name: string;
  email?: string;
  profile_picture?: string;
  created_at: string;
  is_responder: boolean;
}

export interface Responder extends User {
  is_certified: boolean;
  is_available: boolean;
  certification_type?: string;
  certification_uploaded_at?: string;
  latitude?: number;
  longitude?: number;
  successful_responses: number;
}

export interface Emergency {
  id: string;
  user_id: string;
  responder_id?: string;
  latitude: number;
  longitude: number;
  emergency_type: 'Cardiac' | 'Bleeding' | 'Choking' | 'Fracture' | 'Other';
  status: 'pending' | 'in-progress' | 'resolved';
  created_at: string;
  resolved_at?: string;
  description?: string;
}

export interface EmergencyAlert {
  emergency_id: string;
  responder_id: string;
  distance: number;
  estimated_arrival: string;
  emergency_type: string;
  latitude: number;
  longitude: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignout: boolean;
  authContext: {
    register: (phone: string, name: string) => Promise<void>;
    signIn: (phone: string) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (phone: string, name: string) => Promise<void>;
  };
}
