import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Store } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { useParams } from "next/navigation";
import { createContext, ReactNode, useContext, useState } from "react";

const AddStoreItemContext = createContext<AddStoreItemContextType | undefined>(undefined);
interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}
interface AddStoreItemContextType {
    store: Store | null;
    fetchStoreDetails: () => void;
    fetchingStoreDetails: boolean;
}

export const AddStoreItemProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<Store | null>(null)
  const [fetchingStoreDetails, setFetchingStoreDetails] = useState(false)

  const { slug } = useParams()

  function fetchStoreDetails() {
    if(!slug) return
    setFetchingStoreDetails(true)
    renderInstance.get(`/store/${slug}`)
      .then((res) => {
        setStore(res.data)
      }).catch((err) => {
        errorMessage("Error fetching store details")
      }).finally(() => {
        setFetchingStoreDetails(false)
      })
  }

    return (
        <AddStoreItemContext.Provider value={{ store, fetchingStoreDetails, fetchStoreDetails }}>
            {children}
        </AddStoreItemContext.Provider>
    );
}

export const useAddStoreItemContext = (): AddStoreItemContextType => {
    const context = useContext(AddStoreItemContext);
    if (!context) {
        throw new Error('useAddStoreItemContext must be used within a AddStoreitemProvider');
    }
    return context;
};