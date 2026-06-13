import axios, { type AxiosInstance, AxiosError } from "axios";
import { config } from "@/config/env";
import type { ApiError } from "@/types/trip.types";

class ApiClient {
	private client: AxiosInstance;

	constructor() {
		this.client = axios.create({
			baseURL: config.api.baseUrl,
			headers: {
				"Content-Type": "application/json",
			},
			timeout: 30000,
		});

		this.setupInterceptors();
	}

	private setupInterceptors() {
		this.client.interceptors.request.use(
			(config) => {
				// console.log("API Request:", config.method?.toUpperCase(), config.url, config.data);
				return config;
			},
			(error) => {
				console.error("API Request Error:", error);
				return Promise.reject(error);
			},
		);

		this.client.interceptors.response.use(
			(response) => {
				// console.log("API Response:", response.status, response.data);
				return response;
			},
			(error: AxiosError<ApiError>) => {
				console.error("API Response Error:", error.response?.data || error.message);
				if (error.response) {
					throw new Error(error.response.data?.error || `API Error: ${error.response.status}`);
				}
				throw new Error("Network error occurred");
			},
		);
	}

	async post<T>(endpoint: string, data: any): Promise<T> {
		const response = await this.client.post<T>(endpoint, data);
		return response.data;
	}

	async get<T>(endpoint: string): Promise<T> {
		const response = await this.client.get<T>(endpoint);
		return response.data;
	}

	async delete<T>(endpoint: string): Promise<T> {
		const response = await this.client.delete<T>(endpoint);
		return response.data;
	}
}

export const apiClient = new ApiClient();
