"use client"

import TranslatedText from '@/components/Menubar/TranslatedText'
import React, { useEffect, useState } from 'react'
import { WelcomeTranslation } from '../../Farmer/FarmerTranslation'
import { useCookie } from 'next-cookie'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Languages from '@/components/Menubar/Languages'
import { io, Socket } from 'socket.io-client'
import { NestJsBaseURL, renderInstance } from '@/utils/Axios/RenderInstance'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { OwnerNotification } from '@/utils/Types/types'

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const Header = () => {

    const [notifications, setNotifications] = useState<OwnerNotification[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token")

    const fetchNotifications = async () => {
        renderInstance.get(`/owner/${user.userId}`)
            .then((res) => {
                setNotifications(res.data.notifications)
            })
    }

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id))
        renderInstance.delete(`/owner/deleteNotification/${id}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
    }

    const showBrowserNotification = (notification: any) => {
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message
            });
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications()
        }
    }, [])

    useEffect(() => {
        if (!isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    useEffect(() => {
        // Connect to the socket server
        const newSocket: Socket = io(NestJsBaseURL, {
            query: {
                userId: user.userId
            }
        });

        // Listen for the 'newFarmerNotification' event
        newSocket.on('newOwnerNotification', (notification: OwnerNotification) => {
            console.log(notification)
            showBrowserNotification(notification)
            setNotifications((prev) => [notification, ...prev]);
        });

        // Clean up the event listener when the component unmounts
        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return (
        <div className="bg-white text-white p-4 flex flex-col 1050px:flex-row items-start 1050px:items-center justify-start 1050px:justify-between gap-4 shadow-md rounded-2xl mb-4">
            <h1 className="text-xl md:text-3xl font-bold text-gray-700"><TranslatedText greetings={WelcomeTranslation} /> {user.name}</h1>

            <div className="flex items-center space-x-6">

                <div className="relative">
                    <Input
                        type="text"
                        placeholder="Search..."
                        className="p-2 pl-10 pr-4 rounded-full text-gray-800 shadow-md border-2 w-full 768px:w-72"
                    />
                    {/* Search Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.5 3a5.5 5.5 0 11-5.5 5.5A5.507 5.507 0 018.5 3zm0 1a4.5 4.5 0 10-4.5 4.5A4.507 4.507 0 008.5 4zM14 14a6 6 0 11-2.13-4.73l4.9 4.9a1 1 0 011.41-1.42l-4.9-4.9A5.979 5.979 0 0114 14z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>

                <Button
                    className="bg-green-600 hover:bg-green-900 text-white py-2 px-6 rounded-full text-sm hidden 1200px:inline-block">
                    Upgrade Plan
                </Button>

                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5 text-black" />
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 h-4 w-4 bg-primaryColor text-white rounded-full text-xs flex items-center justify-center">
                                    {notifications.length}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 mr-6">
                        <Card className="w-sm">
                            <CardHeader className="pb-3">
                                <CardTitle>Notifications</CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[60vh] overflow-auto">
                                <AnimatePresence initial={false}>
                                    {notifications.map(notification => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="w-full relative mb-4 p-4 bg-gray-100 rounded-lg group"
                                        >
                                            <div className="flex items-start">
                                                <div className="ml-3 flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                                </div>
                                                <Button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="bg-transparent hover:bg-gray-200 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                >
                                                    <Trash2 className="h-4 w-4 text-black" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </PopoverContent>
                </Popover>

                <Languages />
            </div>

        </div>
    )
}

export default Header