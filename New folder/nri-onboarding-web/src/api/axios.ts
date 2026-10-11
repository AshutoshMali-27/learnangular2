import axios from 'axios'
import { ENV } from '@/config/environment'
import { setupInterceptors } from './interceptor'

export const api = axios.create({
  baseURL: ENV.API_BASE,
  // The session is a cookie owned by the backend; nothing is stored client-side.
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

setupInterceptors(api)
