"use client"

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { AuthType } from '@/utils/Types/types'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import CryptoJS from "crypto-js";
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { useRouter } from 'next/navigation'
import { Backdrop, CircularProgress } from '@mui/material'
import { Button } from '@/components/ui/button'

const AdminCreate = () => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [passwordShow, setPasswordShow] = useState(false)
    const [conPassword, setConPassword] = useState("")
    const [conPasswordShow, setConPasswordShow] = useState(false)

    const [loading, setLoading] = useState(false)

    const { refresh } = useRouter()

    const splitFullName = (fullName: string) => {
        const nameParts = fullName.trim().split(/\s+/); // Split by spaces
        const firstName = nameParts.shift(); // Take the first element as the first name
        const lastName = nameParts.pop(); // Take the last element as the last name
        const middleName = nameParts.join(" "); // Join the rest as middle name

        return { firstName, middleName, lastName };
    };

    function handleSubmit() {
        const { firstName, middleName, lastName } = splitFullName(name)

        if (!firstName || !lastName) {
            errorMessage("Please give your full name")
            return
        }

        if (password.length < 7) {
            errorMessage("Password should be atleast 8 characters")
            return
        }

        if (password !== conPassword) {
            errorMessage("Passwords do not match")
            return
        }

        if (!email) {
            errorMessage("Please enter your email")
            return
        }

        const encryptedPassword = CryptoJS.AES.encrypt(
            password,
            "m4AfXfQ&1brl3LjQFYO"
        ).toString();

        const user = {
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            email,
            password: encryptedPassword,
            authType: "EMAIL"
        }

        setLoading(true)
        renderInstance.post('/user/createAdmin', user)
            .then(() => {
                successMessage("Admin created")
                setName("")
                setEmail("")
                setPassword("")
                setConPassword("")
                setTimeout(() => {
                    refresh()
                }, 2000);
            }).catch(() => {
                errorMessage("Some error occurred")
            }).finally(() => { setLoading(false) })
    }

    return (
        <div
            className='w-full h-full flex justify-center'>

            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress />
            </Backdrop>

            <Card className='min-w-[600px] h-fit px-10 py-5 mt-10'>

                <CardHeader>
                    <p className='text-xl font-medium text-center'>
                        Enter admin details
                    </p>
                </CardHeader>

                <CardContent className='space-y-4'>

                    <div className='space-y-2'>
                        <Label className='text-lg'>Full name</Label>
                        <Input
                            type='text'
                            value={name}
                            onChange={e => { setName(e.target.value) }} />
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-lg'>Email</Label>
                        <Input
                            type='email'
                            value={email}
                            onChange={e => { setEmail(e.target.value) }} />
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-lg'>Password</Label>
                        <div className='flex items-center gap-3'>

                            <Input
                                id="password"
                                type={`${passwordShow ? "text" : "password"}`}
                                placeholder='********'
                                value={password}
                                onChange={e => { setPassword(e.target.value) }} />
                            <div onClick={() => { setPasswordShow(pre => !pre) }}>
                                {
                                    passwordShow ?
                                        <EyeOff />
                                        :
                                        <Eye />
                                }
                            </div>

                        </div>
                        {
                            password &&
                            <p
                                className={`${password.length < 8 ? "text-red-500" : "text-green-500"}`}>
                                Password must be at least 8 characters long.
                            </p>
                        }
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-lg'>Confirm password</Label>
                        <div className='flex items-center gap-3'>

                            <Input
                                id="password"
                                type={`${conPasswordShow ? "text" : "password"}`}
                                placeholder='********'
                                value={conPassword}
                                onChange={e => { setConPassword(e.target.value) }} />
                            <div onClick={() => { setConPasswordShow(pre => !pre) }}>
                                {
                                    conPasswordShow ?
                                        <EyeOff />
                                        :
                                        <Eye />
                                }
                            </div>

                        </div>
                        {
                            conPassword &&
                            <p
                                className={`${conPassword.length < 8 ? "text-red-500" : "text-green-500"}`}>
                                Password must be at least 8 characters long.
                            </p>
                        }
                    </div>

                </CardContent>

                <CardFooter>
                    <Button
                        onClick={handleSubmit}>
                        Submit
                    </Button>
                </CardFooter>

            </Card>

        </div>
    )
}

export default AdminCreate