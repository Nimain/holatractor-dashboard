"use client"

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
  } from "@/components/ui/dialog"

const SignupCard = () => {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
  return (
    <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
          <div className="w-[240px] 400px:w-[300px] flex items-center bg-white overflow-hidden rounded-full">
            <div className="px-[20px] py-[10px] w-[70%]">
              <input
                type="text"
                name="registration_last_name"
                id="registration_last_name"
                placeholder="Enter your name"
                className="bg-transparent outline-none border-none text-black"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </div>
            <button
              name="Name_next_button"
              className="p-[10px] w-[30%] flex items-center justify-center bg-[#AB0F0C]"
              onClick={() => {
                setOpen(true)
              }}
            >
              Next
            </button>
        </div>
          </DialogTrigger>

          <DialogContent
            className="bg-white max-h-[90vh] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <DialogHeader>
              <p className="text-2xl font-bold text-center">Give country details</p>
            </DialogHeader>

            <div
              className="bg-white rounded-xl p-[30px] text-black flex gap-[16px] flex-col relative max-h-[80vh] overflow-auto"
              style={{ scrollbarWidth: "none" }}
            >
              
            </div>
          </DialogContent>
        </Dialog>
  )
}

export default SignupCard