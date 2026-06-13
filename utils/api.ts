const BASE_URL = 'https://www.ssdvf.xyz';

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  quantityInStock: number;
  imageURL: string;
  cloudinaryImageId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  _id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  /** 'male' | 'female' | 'both' */
  gender: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailableSlot {
  start: string;
  end: string;
}

export interface Schedule {
  date: string;
  dayOfWeek: string;
  slots: AvailableSlot[];
}

export interface Appointment {
  _id: string;
  /** ObjectId string or populated customer object */
  customer:
    | string
    | {
        _id: string;
        name: string;
        phone: string;
        role: string;
      };
  requestedStart: string;
  requestedEnd: string;
  /** 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' */
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  /** ObjectId string or populated customer object */
  customer: string | object;
  /** ObjectId string or populated product object */
  product:
    | string
    | {
        _id: string;
        name: string;
        price: number;
        category: string;
        imageURL: string;
      };
  reservedQuantity: number;
  /** 'Reserved' | 'Delivered' | 'Cancelled' */
  status: 'Reserved' | 'Delivered' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  user: {
    _id: string;
    clerkUserId: string;
    name: string;
    phone: string;
    /** 'Customer' | 'Admin' */
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  appointments: Appointment[];
  orders: Order[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const errorData = JSON.parse(text);
      message = errorData.message || errorData.error || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  // Health check
  async checkHealth(): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse<{ status: string }>(res);
  },

  // Sync Clerk user with backend
  async syncUser(token: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/users/sync`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<any>(res);
  },

  // Get current user profile (includes appointments and orders)
  async getProfile(token: string): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<UserProfile>(res);
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/api/products`);
    return handleResponse<Product[]>(res);
  },

  async getProductById(productId: string): Promise<Product> {
    const res = await fetch(`${BASE_URL}/api/products/${productId}`);
    return handleResponse<Product>(res);
  },

  // Product Reservations (Orders)
  async createReservation(
    token: string,
    productId: string,
    reservedQuantity: number
  ): Promise<{ message: string; order: Order }> {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, reservedQuantity }),
    });
    return handleResponse<{ message: string; order: Order }>(res);
  },

  // GET /api/orders/me — returns the current user's orders sorted by newest
  async getOrders(token: string): Promise<Order[]> {
    const res = await fetch(`${BASE_URL}/api/orders/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<Order[]>(res);
  },

  // Appointments
  async bookAppointment(
    token: string,
    requestedStart: string,
    durationMinutes: number
  ): Promise<Appointment> {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestedStart, durationMinutes }),
    });
    return handleResponse<Appointment>(res);
  },

  // GET /api/appointments/me — returns the current user's appointments sorted by date
  async getMyAppointments(token: string): Promise<Appointment[]> {
    const res = await fetch(`${BASE_URL}/api/appointments/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<Appointment[]>(res);
  },

  // PATCH /api/appointments/:appointmentId/cancel
  async cancelAppointment(token: string, appointmentId: string): Promise<any> {
    const res = await fetch(
      `${BASE_URL}/api/appointments/${appointmentId}/cancel`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return handleResponse<any>(res);
  },

  /**
   * GET /api/schedules/available?week=YYYY-MM-DD
   * Returns available slots for the week containing the given date.
   * @param token  Bearer token
   * @param weekDate  Any date within the desired week (YYYY-MM-DD). Defaults to today.
   */
  async getAvailableSlots(
    token: string,
    weekDate?: string
  ): Promise<Schedule[]> {
    const week =
      weekDate ?? new Date().toISOString().split('T')[0];
    const res = await fetch(
      `${BASE_URL}/api/schedules/available?week=${week}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return handleResponse<Schedule[]>(res);
  },

  // Services/Items (public — no auth required)
  async getItems(): Promise<Item[]> {
    const res = await fetch(`${BASE_URL}/api/items`);
    return handleResponse<Item[]>(res);
  },
};
