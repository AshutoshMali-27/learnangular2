/** One row of the Data Objection list (`GetobjectionNRIReportDetails`), in app naming. */
export interface ObjectionForm {
  formNo: string
  skRefNo: string
  pan: string
  clientName: string
  nriType: string
  products: string
  punchDate: string
  email: string
  mobile: string
}

export interface ObjectionFilters {
  formNo: string
  pan: string
  mobile: string
  email: string
  fromDate: string
  toDate: string
}

export interface ObjectionItem {
  id: string
  text: string
}

export interface StageObjections {
  remarks: string
  objections: ObjectionItem[]
}

/** Objections of one form keyed by backend stage id (`GetObjectionFormDetails`). */
export type FormObjections = Record<number, StageObjections>
