// accounting.ts
// Service for posting and retrieving accounting records (money collected)
// Uses localStorage as a placeholder for backend persistence.
// Replace with real API integration when backend is ready.

export interface AccountingRecord {
  id: string; // unique id for the record
  amount: number;
  currency: string;
  requestId: string;
  packageId: string;
  client: string;
  date: string;
}

// Save a new accounting record
export function postAccountingRecord(record: AccountingRecord): void {
  // Get existing records
  const key = 'accounting_records';
  const existing = localStorage.getItem(key);
  const records: AccountingRecord[] = existing ? JSON.parse(existing) : [];
  // Add new record
  records.push(record);
  localStorage.setItem(key, JSON.stringify(records));
}

// Retrieve all accounting records
export function getAccountingRecords(): AccountingRecord[] {
  const key = 'accounting_records';
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}
