import { createContext, ReactNode, useContext, useState } from "react";
import Lottie from "lottie-react"

import TractorAnimation from "@/assets/lottie_animations/tractor.json"
import { Backdrop } from "@mui/material";

// Create a context
const LoadingContext = createContext({
    isLoading: false,
    setLoading: (loading: boolean) => { },
});

// Provider component
export const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setLoading] = useState(false);

    return (
        <LoadingContext.Provider value={{ isLoading, setLoading }}>
            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isLoading}
            >
                <div className="w-64 h-64">
                    <Lottie
                        //   lottieRef={lottieRef}
                        animationData={TractorAnimation}
                        loop={true}
                        autoplay={true}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>
            </Backdrop>
            {children}
        </LoadingContext.Provider>
    );
};

// Custom hook to use loading context
export const useLoading = () => {
    return useContext(LoadingContext);
};
