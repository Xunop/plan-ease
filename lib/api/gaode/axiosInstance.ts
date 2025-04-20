// lib/api/axiosInstance.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';

// Create a new Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'https://restapi.amap.com/v3/',  // Base URL for your API
  timeout: 10000,  // Set timeout for requests (10 seconds)
});

// Configure retry behavior using axios-retry
axiosRetry(axiosInstance, {
  retries: 3, // Retry 3 times before failing
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff delay
  retryCondition: (error: AxiosError) => {
    // Retry for network errors or 5xx server errors
    return !!error.response && error.response.status >= 500;
  },
});

// Global error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response, // Return the response if successful
  (error: AxiosError) => {
    // Check for specific error status codes and handle them
    if (error.response) {
      // The request was made and the server responded with a status code that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Handle Unauthorized error
        console.error('Unauthorized access - please check your API key');
      } else if (error.response.status === 500) {
        // Handle Server errors
        console.error('Server error - please try again later');
      } else {
        // For all other errors, log the response
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Please check your internet connection.');
    } else {
      // Something else happened during the setup of the request
      console.error('Error setting up the request:', error.message);
    }

    // Re-throw the error so that the caller can handle it as well
    return Promise.reject(error);
  }
);

export default axiosInstance;
