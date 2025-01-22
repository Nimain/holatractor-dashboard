import { changeFarm } from '@/redux/ActiveFarm/ActiveFarm';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { Farm } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { useDispatch } from 'react-redux';
const FarmContext = createContext<FarmContextType | undefined>(undefined);
interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}
interface FarmContextType {
    farms: Farm[];
    fetchFarmer: () => void;
    fetching: boolean;
    setFarms: Dispatch<SetStateAction<Farm[]>>
}
export const FarmProvider = ({ children }: { children: ReactNode }) => {
    const [farms, setFarms] = useState<Farm[]>([]);
    const [fetching, setFetching] = useState(false)
    const dispatch = useDispatch();
    const { cookie } = useCookie();
    const user: user = cookie.get('user');
    function fetchFarmer() {
        setFetching(true)
        renderInstance
            .get(`/farmer/${user.userId}`)
            .then((res) => {
                setFarms(res.data.farms);
                dispatch(changeFarm(res.data.farms[0]));
            })
            .catch((err) => {
                if (
                    err.response &&
                    err.response.status === 404 &&
                    err.response.data.message === 'Farmer not found'
                ) {
                    errorMessage('Farmer not found');
                } else {
                    errorMessage('Error fetching user details');
                }
            }).finally(() => {
                setFetching(false)
            })
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