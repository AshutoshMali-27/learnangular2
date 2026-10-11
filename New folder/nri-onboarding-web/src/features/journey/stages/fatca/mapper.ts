import { fatcaHolderTypeAt, occupationBlocks, SOURCE_OF_WEALTH_OTHER } from './rules'
import type { FatcaRecord, TaxResidency } from './schema'
import type { FatcaPayload, FatcaRequest } from './types'

// Keys of the backend FATCA model that an individual's declaration never fills. They are
// entity, UBO and reporting fields, sent as empty strings as the MVC page did.
const UNUSED_KEYS = [
  'PEKRN', 'DATA_SRC', 'ADDR_TYPE', 'TAX_RES4', 'TPIN4', 'ID4_TYPE', 'FROM_DATE4', 'TIN4_PROOF_PATH',
  'CORP_SERVS', 'PEP_DETAILS', 'EXEMP_CODE', 'FFI_DRNFE', 'GIIN_NO', 'SPR_ENTITY', 'GIIN_NA',
  'GIIN_EXEMC', 'GIIN_STATUS', 'NFFE_CATG', 'ACT_NFE_SC', 'REL_LISTED', 'EXCH_NAME',
  'PUBLIC_TRADE_NAME_EXCH', 'UBO_APPL', 'UBO_COUNT', 'UBO_NAME', 'UBO_PAN', 'UBO_NATION', 'UBO_ADD1',
  'UBO_ADD2', 'UBO_ADD3', 'UBO_CITY', 'UBO_PIN', 'UBO_STATE', 'UBO_CNTRY', 'UBO_ADD_TY', 'UBO_CTR',
  'UBO_TIN', 'UBO_ID_TY', 'UBO_COB', 'UBO_DOB', 'UBO_GENDER', 'UBO_FR_NAM', 'UBO_OCC', 'UBO_OCC_TY',
  'UBO_TEL', 'UBO_MOBILE', 'UBO_CODE', 'UBO_HOL_PC', 'UBO_DF', 'UBO_US_PERSON_FLG', 'UBO_RES_STATUS',
  'UBO_CUSTOMER_ID', 'UBO_CONTRY_BIRTH', 'UBO_CITIZEN', 'SDFLAG', 'LOG_NAME', 'FILLER1', 'FILLER2',
  'FOREIGN_EXCH_FLG', 'MONEY_LENDING_FLG', 'GAMBLING_FLG', 'NATURE_ORELATION', 'DP_ID', 'OTHER_DETAILS',
  'DATE_OF_INC', 'OTH_REPORT_PERSON', 'FINANCIAL_INS', 'PARTICIPATING_FFI', 'REP_MOD_FFI1',
  'REP_MOD_FFI2', 'ACC_TY_US_PERSON',
] as const

const UNUSED: FatcaPayload = Object.fromEntries(UNUSED_KEYS.map((key) => [key, '']))

/** The only identification type the screen offers. */
const ID_TYPE_TIN = 'T'

const toResidencyKeys = (row: TaxResidency, position: number, used: boolean): FatcaPayload => ({
  [`FROM_DATE${position}`]: used ? row.fromDate : '',
  [`TAX_RES${position}`]: used ? row.countryId : '',
  [`TPIN${position}`]: used ? row.tin.trim() : '',
  [`ID${position}_TYPE`]: used ? ID_TYPE_TIN : '',
  [`TIN${position}_PROOF_PATH`]: used ? (row.proof?.filePath ?? '') : '',
})

export function toFatcaPayload(record: FatcaRecord, index: number): FatcaPayload {
  const blocks = occupationBlocks(record.occupation, index === 0)
  const hasResidency = record.hasForeignTaxResidency === 'Y'

  return {
    ...UNUSED,
    HOLDERTYPE: fatcaHolderTypeAt(index),
    CO_BIR_INC: record.countryOfBirth,
    PO_BIR_INC: record.placeOfBirth.trim(),
    OCC_ID: record.occupation,
    // Details of a block the occupation does not ask for are never sent.
    EMPLOYER_NAME: blocks.employer ? record.employerName.trim() : '',
    EMPLOYER_COUNTRY: blocks.employer ? record.employerCountry : '',
    EMPLOYER_ADDRESS: blocks.employer ? record.employerAddress.trim() : '',
    NATURE_BUS: blocks.business ? record.natureOfBusiness : '',
    OCC_OTHER_NAME: blocks.other ? record.otherOccupation.trim() : '',
    COUNTRY_OF_RESIDENCE: record.countryOfResidence,
    INC_SLAB_ID: record.incomeSlab,
    SRCE_WEALT: record.sourceOfWealth,
    SRCE_WEALT_OTH:
      record.sourceOfWealth === SOURCE_OF_WEALTH_OTHER ? record.sourceOfWealthOther.trim() : '',
    NET_WORTH: record.netWorth,
    NW_DATE: record.netWorthDate,
    NATIONALITY: record.nationality,
    CITIZENSHIP: record.citizenship,
    PEP_FLAG: record.pep,
    PEP_APPROVAL_UPLOAD_PATH: record.pepDocument?.filePath ?? '',
    US_PERSON_FLG: record.usPerson,
    TAX_RES_OTH_CNTRY_FLG: record.hasForeignTaxResidency,
    ...record.residencies.reduce<FatcaPayload>(
      (keys, row, rowIndex) => ({
        ...keys,
        ...toResidencyKeys(row, rowIndex + 1, hasResidency && row.tinStatus === 'valid'),
      }),
      {},
    ),
  }
}

export const toFatcaRequest = (
  records: FatcaRecord[],
  context: { skRefNo: string; empId: string },
): FatcaRequest => ({
  FormEntryID: context.skRefNo,
  EmployeeCode: context.empId,
  FatcaData: records.map(toFatcaPayload),
})
