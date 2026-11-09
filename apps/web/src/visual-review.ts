/** Explicit diagnostic build only; normal production never enables test fixtures or metrics. */
export const visualReviewEnabled=import.meta.env.DEV||import.meta.env.MODE==='visual-review';
