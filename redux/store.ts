import { configureStore } from "@reduxjs/toolkit";
import ActiveLanguage from "./Language/ActiveLanguage";
import SidebarShow from "./Sidebar/SidebarShow";
import ActiveFarm from "./ActiveFarm/ActiveFarm"
import NewStoreShow from "./NewStoreShow/NewStoreShow"

export const store = configureStore({
    reducer: {
        ActiveLanguage: ActiveLanguage,
        SidebarShow: SidebarShow,
        ActiveFarm: ActiveFarm,
        NewStoreShow: NewStoreShow
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;