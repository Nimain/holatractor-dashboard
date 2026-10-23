import { createSlice } from "@reduxjs/toolkit";

interface sidebarShow {
    sidebarShow: boolean;
    activeMenu: string;
}

const initialState: sidebarShow = {
    sidebarShow: false,
    activeMenu: ""
}

const SidebarShow = createSlice({
    initialState,
    name: 'SidebarShow',
    reducers: {
        expandSidebarShow(state) {
            state.sidebarShow = !state.sidebarShow
        },
        updateActiveMenu(state, action) {
            state.activeMenu = action.payload
        }
    }
})

export const { expandSidebarShow, updateActiveMenu } = SidebarShow.actions
export default SidebarShow.reducer