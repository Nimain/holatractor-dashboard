import { changeFarm } from '@/redux/ActiveFarm/ActiveFarm';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { Farm } from '@/utils/Types/types';
import { getAuthUserId } from '@/utils/auth/clientAuth';
import { useCookie } from 'next-cookie';
import { createContext, useState, useContext, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';

const FarmContext = createContext<FarmContextType | undefined>(undefined);

interface UserData {
    userId?: string;
    id?: string;
    sub?: string;
    _id?: string;
    image?: string;
    name?: string;
    email?: string;
}

interface FarmContextType {
    farms: Farm[];
    fetchFarmer: () => void;
    fetching: boolean;
    setFarms: Dispatch<SetStateAction<Farm[]>>
}

export const FarmProvider = ({ children }: { children: ReactNode }) => {
    const [farms, setFarms] = useState<Farm[]>([]);
    const [fetching, setFetching] = useState(false);
    const dispatch = useDispatch();
    const { cookie } = useCookie();

    function getUserId(): string | null {
        const rawUser = cookie.get('user');
        if (rawUser) {
            let user: UserData | null = null;
            if (typeof rawUser === 'string') {
                try {
                    user = JSON.parse(rawUser);
                } catch {
                    user = null;
                }
            } else if (typeof rawUser === 'object') {
                user = rawUser as UserData;
            }
            const foundId = user?.userId || user?.id || user?.sub || user?._id;
            if (foundId) return foundId;
        }
        return getAuthUserId();
    }

    async function fetchFarmer() {
        const userId = getUserId();
        setFetching(true);

        try {
            // 1. Primary: Direct dynamic fetch from /api/farm (which proxies to FastAPI & PostgreSQL)
            const [localRes, fastRes] = await Promise.all([
                axios.get(`/api/farm${userId ? `?owner_id=${userId}` : ''}`, { timeout: 4000 }).catch(() => null),
                axios.get(`http://127.0.0.1:8000/farm${userId ? `?owner_id=${userId}` : ''}`, { timeout: 4000 }).catch(() => null),
            ]);

            const dynamicFarms = Array.isArray(localRes?.data) && localRes.data.length > 0
                ? localRes.data
                : Array.isArray(fastRes?.data?.farms) && fastRes.data.farms.length > 0
                ? fastRes.data.farms
                : Array.isArray(fastRes?.data) && fastRes.data.length > 0
                ? fastRes.data
                : [];

            if (dynamicFarms.length > 0) {
                setFarms(dynamicFarms);
                dispatch(changeFarm(dynamicFarms[0]));
                setFetching(false);
                return;
            }
        } catch {}

        // 2. Secondary fallback to renderInstance
        try {
            const endpoint = userId ? `/farmer/${userId}` : `/farmer`;
            const res = await renderInstance.get(endpoint);
            const fetchedFarms = Array.isArray(res.data?.farms) ? res.data.farms : [];
            if (fetchedFarms.length > 0) {
                setFarms(fetchedFarms);
                dispatch(changeFarm(fetchedFarms[0]));
            }
        } catch {} finally {
            setFetching(false);
        }
    }

    useEffect(() => {
        fetchFarmer();
        const handleFarmCreated = () => {
            fetchFarmer();
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('farmer_farm_created', handleFarmCreated);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('farmer_farm_created', handleFarmCreated);
            }
        };
    }, []);

    return (
        <FarmContext.Provider value={{ farms, fetching, fetchFarmer, setFarms }}>
            {children}
        </FarmContext.Provider>
    );
};

export const useFarmContext = (): FarmContextType => {
    const context = useContext(FarmContext);
    if (!context) {
        throw new Error('useFarmContext must be used within a FarmProvider');
    }
    return context;
};