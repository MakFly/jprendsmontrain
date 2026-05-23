// --- Auth ---

export interface AuthInitResponse {
  redirectToConnectUri: string;
  redirectToCreateUri: string;
}

export interface AuthCallbackRequest {
  code: string;
}

export interface AuthCallbackResponse {
  success: boolean;
}

export interface AuthLogoutResponse {
  redirectLogoutSession: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  mode?: "live" | "imported";
  expiresAt?: number;
}

// --- Station ---

export interface Station {
  code: string;
  label: string;
  latitude?: number;
  longitude?: number;
}

// --- Reservation ---

export interface SearchTravelsRequest {
  origin: string;
  destination: string;
  departureDate: string;
}

export interface TravelSegment {
  departureStation: Station;
  arrivalStation: Station;
  departureDateTime: string;
  arrivalDateTime: string;
  trainNumber: string;
  carrier: string;
}

export interface Travel {
  id: string;
  departureStation: Station;
  arrivalStation: Station;
  departureDateTime: string;
  arrivalDateTime: string;
  duration: string;
  trainNumber: string;
  carrier: string;
  status: string;
  segments: TravelSegment[];
}

export interface SearchTravelsResponse {
  travels: Travel[];
}

export interface BookTravelRequest {
  travelId: string;
}

export interface CancelReservationRequest {
  reservationId: string;
}

// --- Subscription ---

export interface SubscriptionSummary {
  status: string;
  startDate: string;
  endDate: string;
  productName: string;
  customerName: string;
}

// --- Customer ---

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
}

// --- Error ---

export interface SncfErrorResponse {
  error: string;
  message?: string;
  captchaUrl?: string;
}
