import { ReactNode } from "react";
import { Card, CardTitle } from "../../../ui/card";
import Link from "next/link";

function DetailBox({ count, heading, icon, bgcolorCode, textcolorCode, href }: { count: string; heading: string; icon: ReactNode; bgcolorCode: string; textcolorCode: string; href: string; }) {
    return (
        <Link href={href}>
        <Card className="bg-white w-full p-5 flex items-center gap-5">

            <div className={`p-2 aspect-square rounded-full ${bgcolorCode} ${textcolorCode}`}>
                {icon}
            </div>

            <div className="flex flex-col gap-2">

            <CardTitle>
                {count}
            </CardTitle>

            <p className="text-lg font-medium">
                {heading}
            </p>

        </div>

        </Card >
        </Link>
    )
}

export default DetailBox