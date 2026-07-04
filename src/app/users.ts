export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: "patient" | "admin";
  active: boolean;
}