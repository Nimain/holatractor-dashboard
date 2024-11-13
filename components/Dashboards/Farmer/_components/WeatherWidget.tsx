'use client'

import { useEffect, useState } from 'react'
import { Cloud, Droplets, Thermometer, Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import axios from 'axios'
import TranslatedText from '@/components/Menubar/TranslatedText'
import { weatherWidgetTranslations } from '../FarmerTranslation'

interface WeatherData {
    location: {
        name: string
        region: string
        country: string
        localtime: string
    }
    current: {
        temp_c: number
        condition: {
            text: string
            icon: string
        }
        wind_kph: number
        humidity: number
        feelslike_c: number
    }
}

export default function WeatherWidget({ city }: { city: string }) {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchWeather = async () => {
            if (city) {
                setLoading(true)
                axios.get(`http://api.weatherapi.com/v1/current.json?key=faa1393bf68f4098993151953241011&q=${city}`)
                    .then((res) => {
                        // console.log(res)
                        setWeather(res.data)
                    }).catch((err)=>{
                        setError("Can't load weather details")
                    }).finally(() => {
                        setLoading(false)
                    })
            }
        }

        fetchWeather()
    }, [city])

    if (loading) {
        return (
            <Card className="w-full 900px:max-w-md rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (error || !weather) {
        return (
            <Card className="w-full 900px:max-w-md rounded-2xl">
                <CardContent className="py-10 text-center text-muted-foreground">
                    {error || 'Unable to load weather data'}
                </CardContent>
            </Card>
        )
    }

    const { location, current } = weather

    return (
        <Card className="w-full 900px:max-w-md rounded-2xl bg-primaryColor text-white">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{location.name}, {location.region}</span>
                    {/* <Image
                        src={current.condition.icon}
                        alt={current.condition.text}
                        width={64}
                        height={64}
                        className="h-12 w-12"
                    /> */}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center">
                        <Thermometer className="h-6 w-6 text-red-500" />
                        <span className="text-2xl font-bold">{Math.round(current.temp_c)}°C</span>
                        <span className="text-sm"><TranslatedText greetings={weatherWidgetTranslations.feelsLike} /> {Math.round(current.feelslike_c)}°C</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Cloud className="h-6 w-6 text-blue-500" />
                        <span className="text-lg">{current.condition.text}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Wind className="h-6 w-6 text-green-500" />
                        <span>{Math.round(current.wind_kph)} km/h</span>
                        <span className="text-sm"><TranslatedText greetings={weatherWidgetTranslations.wind} /></span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Droplets className="h-6 w-6 text-blue-500" />
                        <span>{current.humidity}%</span>
                        <span className="text-sm"><TranslatedText greetings={weatherWidgetTranslations.humidity} /></span>
                    </div>
                </div>
                <div className="mt-4 text-sm">
                <TranslatedText greetings={weatherWidgetTranslations.lastUpdate} />: {new Date(location.localtime).toLocaleTimeString()}
                </div>
            </CardContent>
        </Card>
    )
}