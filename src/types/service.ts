// Типы для услуг
export interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Типы для создания услуги
export interface CreateServiceRequest {
  name: string;
  price: number;
  durationMin: number;
  description?: string;
}

// Типы для обновления услуги
export interface UpdateServiceRequest {
  name?: string;
  price?: number;
  durationMin?: number;
  description?: string;
  isActive?: boolean;
}

// Типы для ответов API
export interface ServiceResponse extends Service {}

export interface ServicesListResponse extends Array<Service> {}

// Типы для ошибок
export interface ApiError {
  message: string;
  details?: string;
}

// Типы для состояний загрузки
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Типы для операций CRUD
export type ServiceOperation = "create" | "read" | "update" | "delete";

// Типы для фильтрации и сортировки
export interface ServiceFilters {
  isActive?: boolean;
  search?: string;
}

export interface ServiceSortOptions {
  field: "name" | "price" | "durationMin" | "createdAt";
  direction: "asc" | "desc";
}
