import React from 'react'
import Menubar from '../Menubar/Menubar'
import Users from './Users'

const UsersContainer = () => {
  return (
    <div
      className='w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1440px] bg-[#e5e5e5] relative overflow-auto'>

      <Menubar pagename={'Users'} />

      <Users />

    </div>
  )
}

export default UsersContainer