"use client"

import { useEffect, useState } from 'react'
import WithoutStoreBooking from '../WithoutStoreBooking'
import Languages from '@/components/Menubar/Languages'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { useCookie } from 'next-cookie'
import { FarmerNotification } from '@/utils/Types/types'
import { io, Socket } from 'socket.io-client'
import { NestJsBaseURL, renderInstance } from '@/utils/Axios/RenderInstance'
import TranslatedText from '@/components/Menubar/TranslatedText'
import { WelcomeTranslation } from '../FarmerTranslation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
    email_varified: boolean;
  }

const Header = () => {

    const [notifications, setNotifications] = useState<FarmerNotification[]>([])
    const [isOpen, setIsOpen] = useState(false)
  
    const [socket, setSocket] = useState<Socket | null>(null);

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token")

    const deleteNotification = (id: string) => {
      setNotifications(prev => prev.filter(notification => notification.id !== id))
      renderInstance.delete(`/farmer/deleteNotification/${id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    }
 
  const fetchNotifications = async () => {
    renderInstance.get(`/farmer/${user.userId}`)
      .then((res) => {
        setNotifications(res.data.notifications)
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
    if(user){
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
    setSocket(newSocket);

    // Listen for the 'newFarmerNotification' event
    newSocket.on('newFarmerNotification', (notification: FarmerNotification) => {
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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-4">
          <div className="flex items-center mb-4 md:mb-0">
            <h1 className="text-xl md:text-3xl font-bold"><TranslatedText greetings={WelcomeTranslation} /> {user.name}!</h1>
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <WithoutStoreBooking />
            <Languages />
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
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
            <Avatar>
              {
                user.image &&
                <AvatarImage src={user.image} alt={`${user.name}`} />
              }
              <AvatarFallback className="bg-white drop-shadow-md">{user.name[0]}{user.name[1]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
  )
}

export default Header