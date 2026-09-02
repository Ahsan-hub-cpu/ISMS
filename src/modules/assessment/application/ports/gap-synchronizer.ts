export interface Finding {
  readonly actor: { id: string; email: string; fullName: string } | null;
  readonly organizationId: string;
  readonly assessmentId: string;
  readonly assessmentItemId: string;
  readonly controlId: string;
  readonly complianceStatus: string;
  readonly currentPractice: string | null;
}

/**
 * Implemented by the gap module. The assessment module reports what was found
 * and stays unaware of how gaps are identified, scored or closed.
 */
export interface GapSynchronizer {
  (finding: Finding): Promise<void>;
}
