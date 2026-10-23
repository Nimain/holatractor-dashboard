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

    async function fetchOwner() {
        setLoading(true);
        const targetId = user?.userId || getAuthUserId();

        // 1. Try FastAPI endpoint with owner targetId
        if (targetId) {
            try {
                const endpoint = `/owner/get-stores/${targetId}`;
                const res = await renderInstance.get(endpoint);
                const list = Array.isArray(res.data) ? res.data : (res.data?.stores || []);
                if (Array.isArray(list) && list.length > 0) {
                    setStores(list);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.warn("FastAPI fetchOwner error, trying fallback:", err);
            }
        }

        // 2. Fallback to same-origin Next.js API route filtered by owner_id
        try {
            const apiStoreUrl = targetId ? `/api/store?owner_id=${encodeURIComponent(targetId)}` : `/api/store`;
            const localRes = await fetch(apiStoreUrl);
            if (localRes.ok) {
                const localData = await localRes.json();
                if (Array.isArray(localData)) {
                    setStores(localData);
                    setLoading(false);
                    return;
                }
            }
        } catch (e) {
            console.warn("/api/store fetch error in StoreProvider:", e);
        }

        setStores([]);
        setLoading(false);
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