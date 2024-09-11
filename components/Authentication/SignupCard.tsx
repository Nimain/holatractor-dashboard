"use client"

import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog"
import OperatorRegister from './OperatorRegister'
import AgentRegister from './AgentRegister'
import OwnerRegister from './OwnerRegister'
import DealerRegister from './DealerRegister'

const SignupCard = ({ name }: { name: string }) => {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    name="Name_next_button"
                    className="p-[10px] w-[30%] flex items-center justify-center bg-[#AB0F0C]"
                    onClick={() => {
                        setOpen(true)
                    }}
                >
                    Next
                </button>
            </DialogTrigger>

            <DialogContent
                className="bg-white h-fit min-w-[400px] max-w-[600px] overflow-auto"
                style={{ scrollbarWidth: "none" }}
            >

                <div
                    className="bg-white rounded-xl text-black flex gap-4 items-center justify-center flex-col relative min-w-[400px] min-h-[200px] max-h-[90vh] overflow-auto"
                    style={{ scrollbarWidth: "none" }}
                >

                    <div className='flex items-center gap-2'>
                        <p className='text-lg font-medium whitespace-nowrap'>
                            Do you want to be an operator?
                        </p>
                        <OperatorRegister name={name} inPage={false} />
                    </div>

                    <div className='flex items-center gap-2'>
                        <p className='text-lg font-medium whitespace-nowrap'>
                            Do you want to be a dealer?
                        </p>
                        <DealerRegister name={name} inPage={false} />
                    </div>

                    <div className='flex items-center gap-2'>
                        <p className='text-lg font-medium whitespace-nowrap'>
                            Do you want to be an owner?
                        </p>
                        <OwnerRegister name={name} inPage={false} />
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SignupCard