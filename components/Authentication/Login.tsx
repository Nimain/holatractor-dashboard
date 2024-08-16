"use client"

import { CircularProgress } from '@mui/material'
import { useCookie } from 'next-cookie'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import CryptoJS from "crypto-js";
import { decode } from "jsonwebtoken"
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'

const LogInPage = () => {
  
  const [email, setEmail] = useState("")
  const [passwrd, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { cookie } = useCookie();

  function handleLogin(e: any) {
    e.preventDefault()
    setLoading(true)

    const encryptedPassword = CryptoJS.AES.encrypt(
        passwrd,
        "m4AfXfQ&1brl3LjQFYO"
    ).toString();

    renderInstance.post("/user/login", {
        email: email.trim(),
        password: encryptedPassword,
        authType: "EMAIL"
    }).then((res) => {
        if (res.status === 201 && res.data.access_token) {

            const user = decode(res.data.access_token)

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 1);

            // Set the cookie with the calculated expiry date
            cookie.set('access_token', res.data.access_token, { path: '/', expires: expiryDate });
            cookie.set('user', user, { path: '/', expires: expiryDate });

            successMessage("Log in successfull")
            setEmail("")
            setPassword("")
            setTimeout(() => {
                router.push("/")
            }, 1000);
        }
    }).catch((err) => {
        if (err.response && err.response.status === 409 && err.response.data.message === "User not found") {
            errorMessage("User not found")
            setEmail("")
            setPassword("")
        } else if (err.response && err.response.status === 409 && err.response.data.message === "Wrong password") {
            errorMessage("Wrong password")
            setPassword("")
        } else {
            errorMessage("Some error occured")
            console.log(err)
        }
    }).finally(() => {
        setLoading(false)
    })
}

  return (
    <div className='w-full min-h-[100vh] max-h-fit flex items-center justify-center text-[18px]'>

            <Image
                src={"https://wallpapercave.com/wp/wp10547889.jpg"}
                alt='Sign_In_page_right_image'
                className='w-1/2 min-h-[100vh] object-cover hidden 900px:block'
                width={400}
                height={400}
                unoptimized={true} />

            <div className='w-[80vw] 768px:w-1/2 h-full flex items-center justify-center'>

                <div className='flex flex-col gap-[20px] items-center justify-center w-[360px]'>

                    <p
                        className='text-[26px] w-fit font-[600] relative before:absolute before:left-0 before:bottom-[-4px] before:w-[75%] before:h-[3px] before:rounded-full before:bg-purple-400'>
                        Welcome back
                    </p>

                    <p className='text-[14px] font-[500]'>
                        Please sign in to enter the dashboard
                    </p>

                    <div className='w-full'>

                        <label htmlFor="log_in_email">
                            Email
                        </label>

                        <div
                            className='px-[20px] py-[10px] rounded-md w-full overflow-hidden border-[2px] mt-[10px]'>

                            <input
                                type="email"
                                name="log_in_email"
                                id="log_in_email"
                                className='outline-none border-none w-full'
                                placeholder='Enter your email'
                                value={email}
                                onChange={e => { setEmail(e.target.value) }} />

                        </div>

                    </div>

                    <div className='w-full'>

                        <label htmlFor="log_in_email">
                            Password
                        </label>

                        <div
                            className='px-[20px] py-[10px] rounded-md w-full overflow-hidden border-[2px] mt-[10px]'>

                            <input
                                type="password"
                                name="log_in_email"
                                id="log_in_email"
                                className='outline-none border-none w-full'
                                placeholder='Enter your password'
                                value={passwrd}
                                onChange={e => setPassword(e.target.value)} />

                        </div>

                    </div>

                    <button
                        name="add_role_submit_button"
                        className='px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-full mx-auto'
                        onClick={e => handleLogin(e)}>
                        {
                            loading ?
                                <CircularProgress className='text-primaryColor' />
                                :
                                "Log in"
                        }
                    </button>

                    <p className='underline cursor-pointer'>
                        Forgot your password?
                    </p>

                    <p>
                        Don't have an account? <Link href={"/register"} className='text-primaryColor'>Sign up</Link>
                    </p>

                </div>

            </div>

        </div>
  )
}

export default LogInPage