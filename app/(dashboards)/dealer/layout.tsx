import "../../globals.css";
import { ReactNode } from "react";
import ReduxWrapper from "@/components/Dashboards/Dealer/wrapper/ReduxWrapper";

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="en">
            <body style={{ fontFamily: 'Poppins' }} className="bg-[#e5e5e5]">
                <ReduxWrapper>
                    {children}
                </ReduxWrapper>
            </body>
        </html>
    );
}