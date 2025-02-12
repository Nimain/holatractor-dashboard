import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { OperatorAddStoreReuests } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";

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
    const user: user = cookie.get("user")

    function fetchAllOperatorRequests() {
        setFetching(true)
        renderInstance.get(`/owner/get-requests-from-operators-to-join-store/${user.userId}`)
            .then((res) => { setOperatorRequests(res.data) })
            .catch((err) => { errorMessage("Error in fetching operator requests") })
            .then(()=>{setFetching(false)})
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