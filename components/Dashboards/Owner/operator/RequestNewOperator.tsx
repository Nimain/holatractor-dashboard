"use client"

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Operator } from '@/utils/Types/types'
import { useCookie } from 'next-cookie'
import { useEffect, useState } from 'react'
import OperatorCard from './OpertorCard'

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const RequestNewOperator = () => {
    const [operators, setOperators] = useState<Operator[]>([])
    const [fetching, setFetching] = useState(false)

    const { cookie } = useCookie()
    const user: user = cookie.get("user")

    function fetchAllOperators() {
        setFetching(true)
        renderInstance.get(`/owner/get-operators-not-in-store/${user.userId}`)
            .then((res) => { 
                console.log(res)
                setOperators(res.data)
             })
            .catch((err) => { errorMessage("Error fetching operators") })
            .finally(() => { setFetching(false) })
    }

    useEffect(() => {
        if (user) {
            fetchAllOperators()
        }
    }, [])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    New operator
                </Button>
            </DialogTrigger>
            <DialogContent className='grid grid-cols-2 gap-4 max-h-[90vh] overflow-auto' style={{ scrollbarWidth: "none" }}>
                {
                    fetching ?
                        "Loading..."
                        :
                        operators.map((operator, index) => (
                            <OperatorCard key={index} operator={operator} />
                        ))
                }
            </DialogContent>
        </Dialog>
    )
}

export default RequestNewOperator