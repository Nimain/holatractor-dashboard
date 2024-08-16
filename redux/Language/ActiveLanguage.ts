import { createSlice } from "@reduxjs/toolkit";

interface activeLanguge {
    language: string;
}

const initialState: activeLanguge = {
    language: 'en'
}

const ActiveLanguage = createSlice({
    initialState,
    name: 'ActiveLanguage',
    reducers: {
        changeLanguage(state, action) {
            state.language = action.payload
        }
    }
})

export const { changeLanguage } = ActiveLanguage.actions
export default ActiveLanguage.reducer