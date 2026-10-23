import { Backdrop } from "@mui/material";
import Lottie from "lottie-react";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

import ConfirmationAnimation from "@/assets/lottie_animations/confirmations.json"

// Create a context
const ConfirmationContext = createContext({
    StartPlaying: () => { },
});

export const ConfirmationProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setLoading] = useState(false);
    const lottieRef = useRef<any>(null)

    function StartPlaying() {
        setLoading(true)
        if (lottieRef.current) {
            const desiredDuration = 3000 // 3 seconds in milliseconds
            const naturalDuration = (42 / 60) * 1000 // Natural duration in milliseconds
            const speedFactor = naturalDuration / desiredDuration
            lottieRef.current.setSpeed(speedFactor)
            lottieRef.current.play()
          }
    }

    useEffect(() => {
        if (isLoading) {
          const timer = setTimeout(() => {
            setLoading(false)
            if (lottieRef.current) {
                lottieRef.current.stop()
              }
          }, 1500) // Hide animation after 3 seconds
    
          return () => clearTimeout(timer)
        }
      }, [isLoading])

    return (
        <ConfirmationContext.Provider value={{ StartPlaying }}>
            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isLoading}
                onClick={e => { e.stopPropagation() }}
            >
                <div className="w-64 h-64">
                    <Lottie
                        lottieRef={lottieRef}
                        animationData={ConfirmationAnimation}
                        loop={true}
                        autoplay={true}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>
            </Backdrop>
            {children}
        </ConfirmationContext.Provider>
    );
};

export const useConfirmation = () => {
    return useContext(ConfirmationContext);
};