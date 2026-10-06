/**
 * After an assessor resolves a gap, the finding and register must reflect that
 * the shortfall is gone — without sending the user back to edit those screens.
 */
export interface ResolutionPropagator {
  markFindingCompliant(input: {
    assessmentItemId: string;
    actorId: string | null;
    gapReference: string;
  }): Promise<void>;

  markRegisterImplemented(input: {
    assessmentId: string;
    controlId: string;
    gapReference: string;
  }): Promise<void>;
}
