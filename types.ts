export interface IBook {
  id: number;
  title: string;
  author: string;
  price: number;
  description: string;
  isPrivate?: boolean;
  ownerId?: string;
}

export interface IUser {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

export interface ILoginData {
  email: string;
  password: string;
}

export interface IRegisterData {
  email: string;
  password: string;
}
