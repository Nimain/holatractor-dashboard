import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { OperatorAddStoreReuests } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";

import { getAuthUserId } from "@/utils/auth/clientAuth";

const OperatorsRequestToJoinStoreContext = createContext<OperatorsRequestToJoinStoreContextType | undefined>(undefined);

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

interface OperatorsRequestToJoinStoreContextType {
    operatorRequests: OperatorAddStoreReuests[];
    fetchAllOperatorRequests: () => void;
    fetching: boolean;
    setOperatorRequests: Dispatch<SetStateAction<OperatorAddStoreReuests[]>>
}

export const OperatorsRequestToJoinStoreProvider = ({ children }: { children: ReactNode }) => {
    const [operatorRequests, setOperatorRequests] = useState<OperatorAddStoreReuests[]>([])
    const [fetching, setFetching] = useState(false)

    const { cookie } = useCookie()
    const rawUser = cookie.get("user")
    const parsedUser = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser); } catch { return null; } })() : rawUser
    const user: user = parsedUser || {}

    function fetchAllOperatorRequests() {
        setFetching(true)
        const targetId = user?.userId || getAuthUserId();
        const endpoint = targetId
            ? `/owner/get-requests-from-operators-to-join-store/${targetId}`
            : `/owner/get-requests-from-operators-to-join-store`;

        renderInstance.get(endpoint)
            .then((res) => { setOperatorRequests(Array.isArray(res.data) ? res.data : (res.data?.requests || [])) })
            .catch((err) => { console.error("Error in fetching operator requests:", err) })
            .finally(()=>{setFetching(false)})
    }

    return (
        <OperatorsRequestToJoinStoreContext.Provider value={{ operatorRequests, setOperatorRequests, fetchAllOperatorRequests, fetching }}>
            {children}
        </OperatorsRequestToJoinStoreContext.Provider>
    );
}

export const useOperatorsRequestToJoinStoreContext = (): OperatorsRequestToJoinStoreContextType => {
    const context = useContext(OperatorsRequestToJoinStoreContext);
    if (!context) {
        throw new Error('useFarmContext must be used within a FarmProvider');
    }
    return context;
};