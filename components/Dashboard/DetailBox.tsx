import { ReactNode } from "react";
import { Card, CardTitle } from "../ui/card";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

function DetailBox({ 
  count, 
  heading, 
  icon, 
  bgcolorCode, 
  textcolorCode, 
  href, 
  loading = false 
}: { 
  count: string; 
  heading: string; 
  icon: ReactNode; 
  bgcolorCode: string; 
  textcolorCode: string; 
  href: string;
  loading?: boolean;
}) {
    return (
        <Link href={href}>
        <Card className="bg-white w-full p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`p-2 aspect-square rounded-full ${bgcolorCode} ${textcolorCode} flex items-center justify-center`}>
                {icon}
            </div>

            <div className="flex flex-col gap-2">
                {loading ? (
                    <Skeleton className="h-8 w-16" />
                ) : (
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {count}
                    </CardTitle>
                )}

                <p className="text-lg font-medium text-gray-600">
                    {heading}
                </p>
            </div>
        </Card>
        </Link>
    )
}

export default DetailBox
