import React from 'react'
import Menubar from '../Menubar/Menubar'
import ImpactMeasurement from './ImpactMeasurement';

const FarmsContainer = () => {
  return (
    <div
      className='w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] relative overflow-auto'>

      <Menubar pagename={'Review Parts'} />

      < ImpactMeasurement/>

    </div>
  )
}

export default FarmsContainer;