export type Priority = 'Low' | 'Medium' | 'High';
export type Category = 'Pekerjaan' | 'Side Hustle' | 'Pribadi';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  deadline?: string;
  subtasks: Subtask[];
  created_at?: string;
}

export interface Habit {
  id: string;
  name: string;
  created_at?: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
}

export interface WorkspaceNote {
  id: string;
  content: string;
  updated_at?: string;
}

export interface Journal {
  id: string;
  title: string;
  content: string;
  date: string;
}