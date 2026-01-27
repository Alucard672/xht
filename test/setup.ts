import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock Uni API with proper function implementation
const mockUni = {
  getStorageSync: vi.fn(() => null),
  setStorageSync: vi.fn(() => true),
  removeStorageSync: vi.fn(() => true),
  showToast: vi.fn(),
  hideToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  switchTab: vi.fn(),
  navigateBack: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    platform: 'devtools',
    system: 'iOS 15.0',
    model: 'iPhone',
    screenWidth: 375,
    screenHeight: 667,
    windowWidth: 375,
    windowHeight: 667
  })),
  request: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  connectSocket: vi.fn(),
  onSocketOpen: vi.fn(),
  onSocketError: vi.fn(),
  closeSocket: vi.fn()
}

// Assign to global with type assertion
global.uni = mockUni as any

// Mock UniCloud
global.uniCloud = {
  importObject: vi.fn()
} as any

beforeEach(() => {
  vi.clearAllMocks()
})
