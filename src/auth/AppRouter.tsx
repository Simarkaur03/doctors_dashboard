import React from "react";
import { AuthProvider } from "./AuthContext";

export default function AppRouter() {
  return <AuthProvider>{null}</AuthProvider>;
}
