import { publicApiClient } from "./index";

export interface Review {
  id: string;
  masterId: string;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  masterSlug: string;
  authorName: string;
  rating: number;
  text: string;
}

export interface CreateReviewResponse {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export const reviewsApi = {
  getByMasterSlug: async (masterSlug: string): Promise<Review[]> => {
    const response = await publicApiClient.get(`/api/public/${masterSlug}/reviews`);
    return response.data;
  },

  create: async (
    masterSlug: string,
    reviewData: Omit<CreateReviewRequest, "masterSlug">
  ): Promise<CreateReviewResponse> => {
    const response = await publicApiClient.post(
      `/api/public/${masterSlug}/reviews`,
      reviewData
    );
    return response.data;
  },
};

