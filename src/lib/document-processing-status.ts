// Prefix of `documents.flag_reason` when text extraction failed (the status column only allows pending/processed/flagged).
export const PROCESSING_FAILED_PREFIX = "Processing failed:";

export function processingError(flagReason?: string | null): string | null {
  return flagReason?.startsWith(PROCESSING_FAILED_PREFIX)
    ? flagReason.slice(PROCESSING_FAILED_PREFIX.length).trim()
    : null;
}
