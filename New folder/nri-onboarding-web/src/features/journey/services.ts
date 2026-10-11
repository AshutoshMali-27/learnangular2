import type { UploadedFile } from '@/components/shared/file-upload/FileUpload'
import { journeyMock } from './journey.mock'
import type { FatcaRequest } from './stages/fatca/types'
import type { HolderRequest } from './stages/holder/types'
import type { NomineeRequest } from './stages/nominee/types'
import type { ProofRequest } from './stages/proof/types'
import type { AddressRequest } from './stages/address/types'
import type { FormInwardPayload, SaveInwardResult } from './stages/inward/types'
import type { BankRequest } from './stages/bank/types'
import type { BrokerageRequest } from './stages/brokerage/types'
import type { ExtraDetailsRequest } from './stages/extra-details/types'
import type { MiscRequest } from './stages/miscellaneous/types'
import type { BankBranch, BrokerageCharges, EmployeeSign, Journey, PanDetails } from './types'
import type { Option } from '@/components/form'

// UI phase: every function resolves from journey.mock.ts. The signatures are the contract the
// hooks and stages rely on; API integration swaps each body for the call named in its comment
// (paths are in JOURNEY_ENDPOINTS) without touching anything above this layer.

export type CodeKind = 'lead' | 'sales' | 'remisier' | 'referringEmployee'

/** Which upload action a file goes to; each stage has its own. */
export type UploadKind = 'proof' | 'fatcaTin' | 'fatcaPep' | 'nominee' | 'extraDetails' | 'bankLetter'

export interface BankCheck {
  pan: string
  accountNo: string
  ifsc: string
  branchId: string
  accountType: string
}

export interface ContactCheck {
  value: string
  pan: string
  formNo: string
  empId: string
}

export const journeyService = {
  /** CheckFormNo (validity + SK reference no) and GetInProcessData (progress). */
  getJourney: (formNo: string): Promise<Journey> => journeyMock.getJourney(formNo),

  /** SaveFormDetails, `model` form field. Creates the application and returns the SK reference no. */
  saveInward: (payload: FormInwardPayload): Promise<SaveInwardResult> =>
    journeyMock.saveInward(payload),

  /** GetFormDetails, raw string body. Null when the stage has not been saved. */
  getInward: (journey: Journey): Promise<FormInwardPayload | null> =>
    journeyMock.getInward(journey.formNo),

  /** SaveAddress, JSON body. */
  saveAddress: (journey: Journey, request: AddressRequest): Promise<unknown> =>
    journeyMock.saveAddress(journey.formNo, request),

  /** getAddressonformid, raw string body. Null when the stage has not been saved. */
  getAddress: (journey: Journey): Promise<AddressRequest | null> =>
    journeyMock.getAddress(journey.formNo),

  /** CheckPanNo: ITD lookup plus negative-list screening. Rejects when the PAN cannot be used. */
  checkPan: (pan: string): Promise<PanDetails> => journeyMock.checkPan(pan),

  /** CheckEmail (also sends the verification mail). Rejects with the reason when not usable. */
  checkEmail: (check: ContactCheck): Promise<unknown> => journeyMock.checkContact(check.value),

  /** CheckMobile. Rejects with the reason when not usable. */
  checkMobile: (check: ContactCheck): Promise<unknown> => journeyMock.checkContact(check.value),

  /** holder/CheckPanNoforholder. Rejects when the PAN cannot be used. */
  checkHolderPan: (pan: string): Promise<PanDetails> => journeyMock.checkHolderPan(pan),

  /** holder/CheckEmailforholder and holder/CheckMobileforholder. */
  checkHolderEmail: (check: ContactCheck): Promise<unknown> => journeyMock.checkContact(check.value),
  checkHolderMobile: (check: ContactCheck): Promise<unknown> => journeyMock.checkContact(check.value),

  /** Holder/SaveHolders, JSON body. Also used for "Skip Holder" with empty lists. */
  saveHolders: (journey: Journey, request: HolderRequest): Promise<unknown> =>
    journeyMock.saveStage(journey.formNo, 'holder', 3, request, {
      holderCount: request.HolderDetails.length + 1,
    }),

  /** Fatca/SaveFatcaData, JSON body. */
  saveFatca: (journey: Journey, request: FatcaRequest): Promise<unknown> =>
    journeyMock.saveStage(journey.formNo, 'fatca', 4, request),

  /** Fatca/ValidateResidency{1|2|3} with the FATCA country code. Rejects when the TIN is not valid. */
  validateTin: (_row: number, _countryCode: string, tin: string): Promise<unknown> =>
    journeyMock.validateTin(tin),

  /** Proof/SaveProofDetails, JSON body. */
  saveProof: (journey: Journey, request: ProofRequest): Promise<unknown> =>
    journeyMock.saveStage(journey.formNo, 'proof', 5, request),

  /** Nominee/SavenomineeData (`model` field), or SavenomineeDataforNoNominee (JSON) when opting out. */
  saveNominee: (journey: Journey, request: NomineeRequest): Promise<unknown> =>
    journeyMock.saveStage(journey.formNo, 'nominee', 6, request),

  /** Miscellaneous/SavemiscDetails, JSON body. */
  saveMisc: (journey: Journey, request: MiscRequest): Promise<unknown> =>
    journeyMock.saveStage(journey.formNo, 'miscellaneous', 7, request),

  /** ExtraDetails/SaveExtraDetails, `model` form field. Its bank answer decides whether stage 11 is offered. */
  saveExtraDetails: (journey: Journey, request: ExtraDetailsRequest): Promise<unknown> =>
    journeyMock.saveStage(journey.formNo, 'extra-details', 9, request, {
      isBankAvailable: request.OtherDetails.is_bank_available === 'Y' ? 'Y' : 'N',
    }),

  /**
   * ExtraDetails/GetesigndetailsDetails, raw string body. Null when the staff code has no e-sign.
   * The real call returns the signature as base64, which is then uploaded through ExtraDetails/UploadFile.
   */
  lookupEmployeeSign: (code: string): Promise<EmployeeSign | null> => journeyMock.lookupEmployeeSign(code),

  /** Brokerage/GetBrokerageSchemeNames. */
  getBrokerageSchemes: (): Promise<Option[]> => journeyMock.getBrokerageSchemes(),

  /** NRIAccountOpening/GetBrokerageData with the scheme id as parameter1. */
  getBrokerageCharges: (schemeId: string): Promise<BrokerageCharges> =>
    journeyMock.getBrokerageCharges(schemeId),

  /** Brokerage/SaveBrokerage, JSON body. */
  saveBrokerage: (journey: Journey, request: BrokerageRequest): Promise<unknown> =>
    journeyMock.saveStage(journey.formNo, 'brokerage', 10, request),

  /** BankDetail/GetIfscList with the IFSC as parameter1. Null when the code is not in the master. */
  findIfsc: (ifsc: string): Promise<BankBranch | null> => journeyMock.findIfsc(ifsc),

  /** BankDetail/CheckBank (penny-drop). Rejects with the reason when the account is not valid. */
  checkBank: (check: BankCheck): Promise<unknown> => journeyMock.checkBank(check.accountNo),

  /** BankDetail/SavebankDetails, indexed form keys (`BankDetails[0].AccountNumber`). */
  saveBank: (journey: Journey, request: BankRequest): Promise<unknown> =>
    journeyMock.saveStage(journey.formNo, 'bank-details', 11, request),

  /**
   * Proof/UploadFile, Fatca/UploadFile, Fatca/UploadPEPFile, Nominee/UploadFile,
   * ExtraDetails/UploadFile or BankDetail/UploadChequeLeaf. Files land in
   * the form's `{formNo}_{PAN}` folder and the returned relative path goes into the save payload.
   */
  uploadDocument: (
    _kind: UploadKind,
    journey: Journey,
    _file: Blob,
    fileName: string,
    onProgress: (percent: number) => void,
  ): Promise<UploadedFile> =>
    journeyMock.upload(fileName, `${journey.formNo}_${journey.progress.pan}`, onProgress),

  /**
   * UI phase only: what a stage showed when it was saved, for view mode. API integration
   * replaces this with each stage's Get action and a response mapper, as Inward and Address have.
   */
  getStageView: <TView>(journey: Journey, stageKey: string): Promise<TView | null> =>
    journeyMock.getView(journey.formNo, stageKey) as Promise<TView | null>,

  /** validatelead / validatesaleexecativecode / validateremisercode / validatereccode. */
  validateCode: (_kind: CodeKind, code: string, _branchId: string): Promise<unknown> =>
    journeyMock.validateCode(code),
}
