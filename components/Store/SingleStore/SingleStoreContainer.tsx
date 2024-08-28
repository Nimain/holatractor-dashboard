import Menubar from '@/components/Menubar/Menubar'
import React from 'react'
import SingleStore from './SingleStore'

const SingleStoreContainer = () => {
  return (
    <div
      className='w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] relative overflow-auto'>

      <Menubar pagename={'Store'} />

      <SingleStore />

    </div>
  )
}

export default SingleStoreContainer