// The in-depth report as data: which fields each section shows, and in what order.
// Keys are the backend's field names. The ClientData model has about 95 fields; the documented
// samples list only some of them, so this list is extended against the real response at API
// integration (add a `{ label, key }` line per field).

export interface FieldConfig {
  label: string
  key: string
}

const fields = (pairs: [label: string, key: string][]): FieldConfig[] => pairs.map(([label, key]) => ({ label, key }))

export const CLIENT_FIELDS = fields([
  ['Name as per PAN', 'PANNAME'], ['PAN', 'PANNO'], ['Date of Birth', 'DOB'], ['Gender', 'GENDER'],
  ['Mobile', 'MOBILE'], ['Email', 'EmailID'], ['Nationality', 'NATIONALITY'], ['Occupation', 'OCCUPATION'],
  ['Marital Status', 'MARITAL_STATUS'], ['Father Name', 'FATHER_NAME'], ['Residential Status', 'RESIDENTIAL_STATUS'],
  ['Customer ID', 'CustomerID'], ['S2K ID', 'S2K_ID'], ['Login ID', 'LOGIN_ID'], ['Branch Code', 'BRANCH_CODE'],
  ['Branch Name', 'BRANCH_NAME'], ['Account Open Date', 'ACCT_OPEN_DATE'], ['Account Type', 'ACCOUNT_TYPE'],
  ['NRI Type', 'NRI_TYPE'], ['KYC Status', 'KYC_STATUS'], ['KYC No', 'KYCNO'], ['CKYC KIN', 'CKYC_KIN'],
  ['Nominee Available', 'NOMINEE_AVAILABLE'], ['Sales Executive', 'SALES_EXECUTIVE'], ['Contract Note', 'CONTRACT_NOTE'],
  ['Products', 'PRODUCTS'], ['Income Slab', 'INCOME_SLAB'], ['Net Worth', 'NET_WORTH'],
  ['Net Worth Date', 'NET_WORTH_DATE'], ['Source of Wealth', 'SOURCE_OF_WEALTH'], ['KRA Status', 'KRA_STATUS'],
  ['KRA Agency', 'KRA_AGENCY'], ['Citizenship', 'CITIZENSHIP'],
])

export const ADDRESS_FIELDS = fields([
  ['Address Line 1', 'Address1'], ['Address Line 2', 'Address2'], ['City', 'City'], ['State', 'State'],
  ['Country', 'Country'], ['Pincode', 'Pincode'],
])

export const JURISDICTION_FIELDS = fields([
  ['Country of Residence', 'CountryOfResidence'], ['Place of Birth', 'PlaceOfBirth'],
  ['Country of Birth', 'CountryOfBirth'], ['Tax ID', 'TaxId'],
])

export const BANK_COLUMNS = fields([
  ['Bank Name', 'BankName'], ['Account Number', 'AccountNumber'], ['Account Type', 'AccountType'], ['IFSC', 'IFSC'],
  ['MICR', 'MICR'], ['Branch Name', 'BranchName'], ['Status', 'Status'], ['Default', 'Default'],
  ['Proof Uploaded', 'ProofUploaded'], ['UPI VPA', 'UpiVpa'], ['IMPS Flag', 'ImpsFlag'],
  ['Reverse Penny Flag', 'ReversePennyFlag'],
])

export const PROOF_COLUMNS = fields([
  ['Proof Type', 'ProofName'], ['Proof No', 'ProofNumber'], ['Valid From', 'DateOfIssue'],
  ['Valid To', 'DateOfExpiry'], ['Proof Place', 'PlaceOfIssue'],
])

export const DP_COLUMNS = fields([
  ['DP Name', 'DpName'], ['DP ID Number', 'DpIdNumber'], ['Type', 'DpType'], ['Beneficiary Name', 'DpBeneficiaryName'],
  ['Client Beneficiary ID', 'ClientBenficiaryId'], ['DP With Client ID', 'DpWithClientId'], ['Status', 'Status'],
  ['Default', 'IsDefault'], ['POA', 'Poa'], ['BSDA', 'Bsda'], ['Investtiger Status', 'InvesttigerStatus'],
])

export const FATCA_SUMMARY = fields([['Client Code', 'ClientCode'], ['Holder Type', 'HolderType'], ['Nationality', 'Nationality']])
export const FATCA_FIELDS = fields([
  ['Country of Birth', 'CountryOfBirth'], ['Place of Birth', 'PlaceOfBirth'], ['Occupation', 'Occupation'],
  ['PEP Status', 'PepStatus'], ['Tax Residency', 'TaxResidency'], ['TIN', 'TIN'],
])

export const NOMINEE_SUMMARY = fields([['Nominee Name', 'NomineeName'], ['Share %', 'Share'], ['Relation', 'Relation']])
export const NOMINEE_FIELDS = fields([
  ['Date of Birth', 'DateOfBirth'], ['Address', 'Address'], ['Mobile', 'Mobile'], ['Guardian', 'Guardian'],
])

export const EXTRA_FIELDS = fields([
  ['IPV Employee Code', 'IpvEmpCode'], ['IPV Date', 'IpvDate'], ['OSV Staff', 'OsvStaff'], ['OSV Date', 'OsvDate'],
  ['Country of Residence', 'CountryOfResidence'], ['Nature of Business', 'NatureOfBusiness'],
])

export const pick = (source: Record<string, string> | undefined, config: FieldConfig[]) =>
  config.map(({ label, key }) => ({ label, value: source?.[key] ?? '' }))

/** Up to two initials for the summary avatar. */
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('')
