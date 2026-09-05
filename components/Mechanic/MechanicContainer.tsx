import React from 'react'
import Menubar from '../Menubar/Menubar'
import MechanicSection from './Mechanic'

const MechanicContainer = () => {
  return (
    <div className='w-full min-h-[100vh] p-[10px] 1050px:p-[30px] bg-[#e5e5e5] relative overflow-auto'>
      <Menubar pagename={'Mechanic'} />
      <MechanicSection />
    </div>
  )
}

export default MechanicContainer
