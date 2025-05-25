"use server";

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import axiosRetry from "axios-retry";
import { SignJWT, importPKCS8 } from "jose";

const apiHost = process.env.NEXT_PUBLIC_WEATHER_API_HOST || "https://api_host";
const projectId = process.env.NEXT_PUBLIC_QWEATHER_PROJECT_ID;
const privateKey = process.env.QWEATHER_PRIVATE_KEY; // Ensure this is kept secure

if (!apiHost || apiHost === "https://api_host") {
  console.warn(
    "Weather API Host is not properly configured. Using placeholder. Please set NEXT_PUBLIC_WEATHER_API_HOST.",
  );
}

if (!projectId) {
  console.warn(
    "QWeather Project ID (NEXT_PUBLIC_QWEATHER_PROJECT_ID) is not set. JWT generation will fail.",
  );
}

if (!privateKey) {
  console.warn(
    "QWeather Private Key (QWEATHER_PRIVATE_KEY) is not set. JWT generation will fail.",
  );
}

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

let currentToken: string | null = null;
let isFetchingToken = false;
let tokenFetchQueue: ((token: string | null) => void)[] = [];

async function generateJWT(): Promise<string | null> {
  if (!projectId || !privateKey) {
    console.error("Project ID or Private Key not available for JWT generation.");
    return null;
  }

  try {
    const privateKeyObject = await importPKCS8(privateKey, 'EdDSA');
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expirationTime = nowSeconds + 86400; // Expires in 24 hours

    const jwt = await new SignJWT({ sub: projectId, iat: nowSeconds - 30, exp: expirationTime })
      .setProtectedHeader({ alg: 'EdDSA', kid: projectId })
      .sign(privateKeyObject);

    return jwt;
  } catch (error) {
    console.error("Error generating JWT:", error);
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  if (currentToken) {
    return currentToken;
  }

  if (isFetchingToken) {
    return new Promise((resolve) => {
      tokenFetchQueue.push(resolve);
    });
  }

  isFetchingToken = true;
  const token = await generateJWT();
  currentToken = token;
  isFetchingToken = false;
  tokenFetchQueue.forEach((resolve) => resolve(token));
  tokenFetchQueue = [];
  return currentToken;
}

let isRefreshingToken = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  if (isRefreshingToken) {
    return refreshPromise;
  }

  isRefreshingToken = true;
  refreshPromise = generateJWT()
    .then((newToken) => {
      currentToken = newToken;
      isRefreshingToken = false;
      refreshPromise = null;
      return newToken;
    })
    .catch((error) => {
      console.error("Error refreshing token:", error);
      currentToken = null;
      isRefreshingToken = false;
      refreshPromise = null;
      return null;
    });

  return refreshPromise;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: apiHost,
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("JWT could not be obtained. Requests may fail.");
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    return !!error.response && error.response.status >= 500;
  },
});

axiosInstance.interceptors.response.use(
  async (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const originalRequest = error.config as InternalAxiosRequestConfig;

      if (status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        const newToken = await refreshToken();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } else {
          console.error("Token refresh failed. Please re-authenticate.");
          // TODO: Handle re-authentication logic
        }
      } else if (status === 403) {
        console.error(
          "Forbidden: Disable access - you do not have permission to access this resource",
        );
      } else if (status >= 500) {
        console.error(`Server Error: ${status} - Please try again later`);
      } else {
        const data = error.response.data;
        const responseDataString =
          typeof data === "string" ? data : JSON.stringify(data);
        console.error(`Error: ${status} - ${responseDataString}`);
      }
    } else if (error.request) {
      console.error(
        "No response received. Please check your internet connection.",
      );
    } else {
      console.error(
        "Request Setup Error: error setting up the request",
        error.message,
      );
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
