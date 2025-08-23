// src/results/results.dto.ts

interface RegionResult {
  [choice: string]: number; // 예: { "A": 100, "B": 120 }
}

export class ResultsDto {
  total: {
    A: number;
    B: number;
    total_votes: number;
  };
  by_region: {
    [region: string]: RegionResult; // 예: { "서울": { "A": 100, "B": 120 } }
  };
}