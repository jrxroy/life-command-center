export type FrequencyType = 'daily' | 'specific_days' | 'weekly_count' | 'monthly';

export interface Habit {
  id: string;
  title: string;
  category: string;
  frequency_type: FrequencyType;
  frequency_target?: {
    days?: number[]; // [1, 3, 5] untuk Senin, Rabu, Jumat
    count?: number;  // misal 3 kali seminggu
  };
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
}