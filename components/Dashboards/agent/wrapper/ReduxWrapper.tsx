"use client";

import { store } from "@/redux/store";
import React, { ReactNode } from "react";
import { Provider } from "react-redux";
import SidebarWrapper from "./SidebarWrapper";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "../../../ui/sonner";

const ReduxWrapper = ({ children }: { children: ReactNode }) => {

  return (
    <Provider store={store}>
      <ToastContainer />
      <Toaster />
      <SidebarWrapper>
        {children}
      </SidebarWrapper>
    </Provider>
  );
};

export default ReduxWrapper;
