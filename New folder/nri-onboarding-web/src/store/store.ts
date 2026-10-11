import { configureStore } from '@reduxjs/toolkit'
import draftsReducer from './slices/draftsSlice'
import uiReducer, { UI_STORAGE_KEYS, type UiState } from './slices/uiSlice'

// Client state only. Everything that comes from the server lives in TanStack Query.
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    drafts: draftsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// UI preferences are the only persisted client state.
const applyUi = (ui: UiState) => {
  document.documentElement.classList.toggle('dark', ui.mode === 'dark')
  document.documentElement.dataset.theme = ui.theme
  try {
    localStorage.setItem(UI_STORAGE_KEYS.mode, ui.mode)
    localStorage.setItem(UI_STORAGE_KEYS.theme, ui.theme)
    localStorage.setItem(UI_STORAGE_KEYS.sidebarPinned, String(ui.sidebarPinned))
  } catch {
    // Storage unavailable (private mode): the preference just lasts for this tab.
  }
}

let appliedUi = store.getState().ui
applyUi(appliedUi)
store.subscribe(() => {
  const { ui } = store.getState()
  if (ui !== appliedUi) {
    appliedUi = ui
    applyUi(ui)
  }
})
