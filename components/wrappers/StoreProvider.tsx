import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Store } from "@/utils/Types/types";
import { getAuthUserId } from "@/utils/auth/clientAuth";
import { useCookie } from "next-cookie";
import { ReactNode, useContext, useState, createContext, Dispatch, SetStateAction } from "react";

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const OwnerStoreContext = createContext<OwnerStoreType | undefined>(undefined);

interface OwnerStoreType {
    stores: Store[];
    fetchOwner: () => void;
    loading: boolean;
    setStores: Dispatch<SetStateAction<Store[]>>
}

export const OwnerStoreProvider = ({ children }: { children: ReactNode }) => {
    const [stores, setStores] = useState<Store[]>([])
    const [loading, setLoading] = useState(false)

    const { cookie } = useCookie();
    const rawUser = cookie.get('user');
    const parsedUser = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser); } catch { return null; } })() : rawUser;
    const user: user = parsedUser || {};

    function fetchOwner() {
        const targetId = user?.userId || getAuthUserId();
        const endpoint = targetId ? `/owner/get-stores/${targetId}` : `/owner/get-stores`;
        setLoading(true);
        renderInstance.get(endpoint)
            .then((res) => {
                setStores(res.data || []);
            }).catch((err) => {
                console.error("Error fetching owner stores:", err);
            }).finally(() => {
                setLoading(false);
            });
    }

    return (
        <OwnerStoreContext.Provider value={{ stores, loading, setStores, fetchOwner }}>
            {children}
        </OwnerStoreContext.Provider>
    );
};
export const useOwnerStoreContext = (): OwnerStoreType => {
    const context = useContext(OwnerStoreContext);
    if (!context) {
        throw new Error('useFarmContext must be used within a FarmProvider');
    }
    return context;
};