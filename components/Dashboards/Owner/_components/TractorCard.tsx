"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tractor, TractorType } from "@/utils/Types/types";
import Image from "next/image";
import { singleStoreOwnerTranslations } from "../SingleStoreTranslation";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { Calendar, Eye, Fuel, Settings, Settings2, Zap } from "lucide-react";

interface TractorCardProps {
  tractor: Tractor;
}

export function TractorCard({ tractor }: TractorCardProps) {
  return (
    <Card className="w-full max-w-sm hover:drop-shadow-lg hover:scale-110 transition-all duration-300 ">
      <CardHeader className="relative border-2 border-black rounded-t-md">
        <Image
          src={tractor.images[0] || "/placeholder.svg?height=300&width=300"}
          alt={tractor.name}
          width={400}
          height={400}
          unoptimized={true}
          className="object-cover w-full h-48 rounded-md"
        />
        <div className="absolute bottom-2 left-3  border  bg-neutral-50 p-1  text-red-500 rounded-md">
          <p className="font-bold">$45,000</p>
          <p className="text-xs">$1200/month</p>
        </div>
      </CardHeader>
      <CardContent className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white p-4">
        <CardTitle className="flex items-center justify-between mb-3">
          <span>{tractor.name}</span>
          {/* <Badge>{tractor.type}</Badge> */}
        </CardTitle>
        {/* <p className="text-muted">{tractor.description}</p>
        {tractor.model && (
          <p>
            <TranslatedText greetings={singleStoreOwnerTranslations.model} />:{" "}
            {tractor.model}
          </p>
        )} */}
        {/* {tractor.year && <p className="text-sm">Year: {tractor.year.getFullYear()}</p>} */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {/* Power */}
          <div className="bg-white text-red-600  p-1 rounded-md shadow">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Power</span>
            </div>
            <p className="text-sm font-bold pl-7  flex justify-center">100HP</p>
          </div>

          {/* Fuel */}
          <div className="bg-white text-red-600  p-1 rounded-md shadow">
            <div className="flex items-center justify-center gap-2">
              <Fuel className="w-5 h-5" />
              <span>Fuel</span>
            </div>
            <p className="text-sm font-bold pl-7  flex justify-center">80L</p>
          </div>

          {/* Year */}
          <div className="bg-white text-red-600  p-1 rounded-md shadow">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>Year</span>
            </div>
            <p className="text-sm font-bold pl-7  flex justify-center">2025</p>
          </div>

          {/* Transmission */}
          <div className="bg-white text-red-600  p-1 rounded-md shadow">
            <div className="flex items-center justify-center gap-2">
              <Settings className="w-5 h-5" />
              <span>Transmission</span>
            </div>
            <p className="text-sm font-bold pl-7 flex justify-center">
              Automatic
            </p>
          </div>
        </div>
        <div>
          <h1 className="text-white text-xl mt-1">Features</h1>
          <div className="flex justify-evenly">
            <p className="border rounded-full text-xs p-2">Gps Tracking</p>
            <p className="border rounded-full text-xs p-2">Air condition</p>
            <p className="border rounded-full text-xs p-2 ">Heated seat</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-center bg-gradient-to-r from-[#8c0000] to-[#4d0000] rounded-b-md">
        <Button className="w-full bg-orange-500 hover:bg-orange-600">
          {" "}
          <Eye />{" "}
          <TranslatedText
            greetings={singleStoreOwnerTranslations.viewDetails}
          />
        </Button>
        <button className="bg-orange-500 hover:bg-orange-600 p-2 text-white rounded-md mx-1">
          <TranslatedText greetings={singleStoreOwnerTranslations.Contact} />
        </button>
      </CardFooter>
    </Card>
  );
}
