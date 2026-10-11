import { createContext, useContext } from 'react'

export interface StageMode {
  /**
   * `objection`: the stage was reopened to correct scrutiny objections. It loads its saved
   * data, stays editable, and returns to the objection hub after saving.
   */
  isObjection: boolean
  /** Where to go after a successful save, when it is not simply "the next stage". */
  returnPath?: string
}

const DEFAULT: StageMode = { isObjection: false }

/** Set by the page that hosts a stage; stages and their hooks read it instead of taking props. */
export const StageModeContext = createContext<StageMode>(DEFAULT)

export const useStageMode = () => useContext(StageModeContext)
