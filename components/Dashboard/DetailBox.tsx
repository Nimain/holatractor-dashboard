import { Card, CardTitle } from "../ui/card";

function DetailBox({count, heading}: {count: string; heading: string}) {
    return(
        <Card className="bg-white w-fit p-5 flex flex-col gap-2">

            <CardTitle className="text-[#3CD856]">
                {count}
            </CardTitle>

            <p className="text-lg font-medium">
                {heading}
            </p>

        </Card>
    )
}

export default DetailBox