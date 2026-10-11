import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Unsaved, in-memory stage work: the wizard position and the record lists a stage collects
// before its single save call (holders, FATCA records, proof documents, nominees, bank accounts).
// Each stage types its own `data` through its selectors.

export interface StageDraft {
  step: number
  data?: unknown
}

export type DraftsState = Record<string, StageDraft>

const initialState: DraftsState = {}

const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    draftStepChanged: (state, action: PayloadAction<{ stage: string; step: number }>) => {
      const { stage, step } = action.payload
      state[stage] = { ...state[stage], step }
    },
    draftDataChanged: (state, action: PayloadAction<{ stage: string; data: unknown }>) => {
      const { stage, data } = action.payload
      state[stage] = { step: state[stage]?.step ?? 0, data }
    },
    /** Removes a stage's draft and every sub-draft keyed under it (`stage:…`). */
    draftCleared: (state, action: PayloadAction<string>) => {
      const prefix = `${action.payload}:`
      for (const key of Object.keys(state)) {
        if (key === action.payload || key.startsWith(prefix)) delete state[key]
      }
    },
    draftsReset: () => initialState,
  },
})

export const { draftStepChanged, draftDataChanged, draftCleared, draftsReset } = draftsSlice.actions
export default draftsSlice.reducer
