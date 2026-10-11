import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ColorMode = 'light' | 'dark'
export type ColorTheme = 'hdfc' | 'sbi' | 'icici' | 'axis' | 'kotak' | 'emerald' | 'graphite'

export interface UiState {
  mode: ColorMode
  theme: ColorTheme
  /** Desktop sidebar: expanded with labels, or collapsed to an icon rail. */
  sidebarPinned: boolean
}

// The palettes behind each id live in index.css under `[data-theme]`.
export const THEMES: { id: ColorTheme; label: string; hint: string; swatch: [string, string] }[] = [
  { id: 'hdfc', label: 'HDFC style', hint: 'Navy blue & red', swatch: ['#004c8f', '#ed232a'] },
  { id: 'sbi', label: 'SBI style', hint: 'Indigo blue & cyan', swatch: ['#2b1a8a', '#00b5ef'] },
  { id: 'icici', label: 'ICICI style', hint: 'Orange & maroon', swatch: ['#b23a12', '#5a1d10'] },
  { id: 'axis', label: 'Axis style', hint: 'Burgundy & pink', swatch: ['#97144d', '#ff5c97'] },
  { id: 'kotak', label: 'Kotak style', hint: 'Red & navy', swatch: ['#c8141b', '#062a55'] },
  { id: 'emerald', label: 'Emerald', hint: 'Green & gold', swatch: ['#0b6b4f', '#f2c14e'] },
  { id: 'graphite', label: 'Graphite', hint: 'Charcoal & teal', swatch: ['#1f2a3a', '#2dd4bf'] },
]

const isTheme = (value: string | null): value is ColorTheme => THEMES.some((theme) => theme.id === value)

// Same keys as the MVC ThemeManager, so a user's preference carries over.
export const UI_STORAGE_KEYS = {
  mode: 'app-mode',
  theme: 'app-color-theme',
  sidebarPinned: 'sidebarPinned',
} as const

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const storedTheme = read(UI_STORAGE_KEYS.theme)

const initialState: UiState = {
  mode: read(UI_STORAGE_KEYS.mode) === 'dark' ? 'dark' : 'light',
  theme: isTheme(storedTheme) ? storedTheme : 'hdfc',
  // Expanded unless the user collapsed it.
  sidebarPinned: read(UI_STORAGE_KEYS.sidebarPinned) !== 'false',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    modeToggled: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark'
    },
    sidebarPinToggled: (state) => {
      state.sidebarPinned = !state.sidebarPinned
    },
    modeSet: (state, action: PayloadAction<ColorMode>) => {
      state.mode = action.payload
    },
    themeSet: (state, action: PayloadAction<ColorTheme>) => {
      state.theme = action.payload
    },
  },
})

export const { modeToggled, sidebarPinToggled, modeSet, themeSet } = uiSlice.actions
export default uiSlice.reducer
