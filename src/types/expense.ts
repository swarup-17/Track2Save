export interface Expense {
  _id: string;
  amount: number;
  isSplitted: boolean;
  payers: {
    userId: string;
    amount: number;
  }[];
  category: string;
  note: string;
  date: Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}