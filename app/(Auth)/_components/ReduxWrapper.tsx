"use client";

import { store } from "@/redux/store";
import React, { ReactNode } from "react";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LoadingProvider } from "@/components/wrappers/LoaderWrappers";

const ReduxWrapper = ({ children }: { children: ReactNode }) => {

  return (
    <Provider store={store}>
      <LoadingProvider>
        <ToastContainer />
        {children}
      </LoadingProvider>
    </Provider>
  );
};

export default ReduxWrapper;
