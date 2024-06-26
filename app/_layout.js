import { View } from "react-native";
import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import "../global.css";
import { AuthContextProvider, useAuth } from "../context/authContext";
import { MenuProvider } from "react-native-popup-menu";

const MainLayout = () => {
  const {isAuthenticated} = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if(typeof isAuthenticated === "undefined") return;
    const inApp = segments[0] === "(app)";
    if(isAuthenticated && !inApp) {
      router.replace("home");
    } else {
      router.replace("signIn");
    }
  }, [isAuthenticated]);

  return <Slot />;
}

export default function _layout() {
  return (
    <MenuProvider style={{ backgroundColor: "#121212" }}>
      <AuthContextProvider>
          <MainLayout />
      </AuthContextProvider>
    </MenuProvider>
  );
}