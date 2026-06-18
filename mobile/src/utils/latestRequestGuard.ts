export type LatestRequestRef = { current: number };

export function beginLatestRequest(ref: LatestRequestRef): {
  requestSeq: number;
  isCurrentRequest: () => boolean;
} {
  const requestSeq = ref.current + 1;
  ref.current = requestSeq;
  return {
    requestSeq,
    isCurrentRequest: () => ref.current === requestSeq,
  };
}
