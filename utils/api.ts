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
  gender: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Schedule {
  _id: string;
  dayOfWeek?: string;
  date?: string;
  slots?: string[] | { time: string; available: boolean }[];
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export interface Appointment {
  _id: string;
  userId: string;
  requestedStart: string;
  durationMinutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  userId: string;
  productId: string | Product;
  reservedQuantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  _id: string;
  clerkId: string;
  email: string;
  name?: string;
  role: 'customer' | 'admin' | 'barber';
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
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<any>(res);
  },

  // Get current user profile (includes appointments and orders)
  async getProfile(token: string): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  async createReservation(token: string, productId: string, reservedQuantity: number): Promise<Order> {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, reservedQuantity }),
    });
    return handleResponse<Order>(res);
  },

  async getOrders(token: string): Promise<Order[]> {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Order[]>(res);
  },

  // Appointments
  async bookAppointment(token: string, requestedStart: string, durationMinutes: number): Promise<Appointment> {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ requestedStart, durationMinutes }),
    });
    return handleResponse<Appointment>(res);
  },

  async getMyAppointments(token: string): Promise<Appointment[]> {
    // There are two endpoints in postman, we will try appointments/me first, then fallback to appointments
    try {
      const res = await fetch(`${BASE_URL}/api/appointments/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await handleResponse<Appointment[]>(res);
    } catch {
      const res = await fetch(`${BASE_URL}/api/appointments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse<Appointment[]>(res);
    }
  },

  async cancelAppointment(token: string, appointmentId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<any>(res);
  },

  // Schedules (available hours)
  async getSchedules(token: string): Promise<Schedule[]> {
    const res = await fetch(`${BASE_URL}/api/schedules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Schedule[]>(res);
  },

  // Services/Items (unauthenticated/authenticated)
  async getItems(): Promise<Item[]> {
    const res = await fetch(`${BASE_URL}/api/items`);
    return handleResponse<Item[]>(res);
  }
};
