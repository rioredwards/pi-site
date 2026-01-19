export type Photo = {
  id: string;
  order: number;
  userId: string;
  imgFilename: string;
  src: string;
  alt: string;
};

export type User = {
  id: string;
  displayName: string | null;
  profilePicture: string | null;
  createdAt: Date;
  updatedAt: Date;
};

