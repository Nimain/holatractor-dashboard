import { createSlice } from "@reduxjs/toolkit";

interface activeNewStoreShow {
    show: boolean;
}

const initialState: activeNewStoreShow = {
    show: false
}

const NewStoreShow = createSlice({
    initialState,
    name: 'NewStoreShow',
    reducers: {
        changeNewStoreShow(state) {
            state.show = !state.show
        }
    }
})

export const { changeNewStoreShow } = NewStoreShow.actions
export default NewStoreShow.reducer