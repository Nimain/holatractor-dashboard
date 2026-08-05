"use client";
import "../globals.css";
import React, { ReactNode } from "react";
import ReduxWrapper from "./_components/ReduxWrapper";
import { GoogleOAuthProvider } from "@react-oauth/google";

const AuthenticationLayout = ({ children }: { children: ReactNode }) => {
  return (
    <GoogleOAuthProvider clientId="476382375684-u81f43j8r31gbm0df8q982pbuibg7t5i.apps.googleusercontent.com">
      <ReduxWrapper>
        <div className="w-full min-h-screen">{children}</div>
      </ReduxWrapper>
    </GoogleOAuthProvider>
  );
};

export default AuthenticationLayout;
