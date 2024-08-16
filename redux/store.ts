import { configureStore } from "@reduxjs/toolkit";
import ActiveLanguage from "./Language/ActiveLanguage";
import SidebarShow from "./Sidebar/SidebarShow";

export const store = configureStore({
    reducer: {
        ActiveLanguage: ActiveLanguage,
        SidebarShow: SidebarShow
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;