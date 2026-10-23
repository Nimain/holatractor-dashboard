import { Farm } from "@/utils/Types/types";
import { createSlice } from "@reduxjs/toolkit";

interface activeFarm {
    activeFarm: Farm | null;
}

const initialState: activeFarm = {
    activeFarm: null
}

const ActiveFarm = createSlice({
    initialState,
    name: 'ActiveFarm',
    reducers: {
        changeFarm(state, action) {
            state.activeFarm = action.payload
        }
    }
})

export const { changeFarm } = ActiveFarm.actions
export default ActiveFarm.reducer