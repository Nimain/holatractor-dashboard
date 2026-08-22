import { changeFarm } from '@/redux/ActiveFarm/ActiveFarm';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { Farm } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { useDispatch } from 'react-redux';

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
        if (!rawUser) return null;
        let user: UserData | null = null;
        if (typeof rawUser === 'string') {
            try {
                user = JSON.parse(rawUser);
            } catch {
                return null;
            }
        } else if (typeof rawUser === 'object') {
            user = rawUser as UserData;
        }
        return user?.userId || user?.id || user?.sub || user?._id || null;
    }

    function fetchFarmer() {
        const userId = getUserId();
        if (!userId) {
            return;
        }

        setFetching(true);
        renderInstance
            .get(`/farmer/${userId}`)
            .then((res) => {
                const fetchedFarms = Array.isArray(res.data?.farms) ? res.data.farms : [];
                setFarms(fetchedFarms);
                if (fetchedFarms.length > 0) {
                    dispatch(changeFarm(fetchedFarms[0]));
                }
            })
            .catch((err) => {
                console.error("Error fetching farmer details in FarmProvider:", err);
            })
            .finally(() => {
                setFetching(false);
            });
    }

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