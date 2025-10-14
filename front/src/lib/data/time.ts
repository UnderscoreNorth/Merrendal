export type Period = "Afternoon" | "Morning" | "Evening";
export type Season = "Winter" | "Spring" | "Autumn" | "Summer";
export type Time = {
  day: number;
  year: number;
  period: Period;
};
