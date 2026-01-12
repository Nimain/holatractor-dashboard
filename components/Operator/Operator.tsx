"use client";

import { useEffect, useState } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Operator } from "@/utils/Types/types";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import OperatorRegister from "../Authentication/OperatorRegister";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Operator.svg";
import OperatorAction from "./OperatorAction";

const OperatorSection = () => {
    const [activeHover, setActiveHover] = useState("");
    const [mailHover, setMailHover] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<Operator[]>([]);
    const [open, setOpen] = useState(false);
    const [newOperatorName, setNewOperatorName] = useState("");
    const [isSignUpCard, setIsSignUpCard] = useState(false);

    const sortUsersByUpdateDate = (list: Operator[]) =>
        list.sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

    function fetchAllUsers() {
        setLoading(true);
        renderInstance
            .get("/operator")
            .then((res) => setUsers(sortUsersByUpdateDate(res.data)))
            .catch(() => errorMessage("Error fetching operator list"))
            .finally(() => setLoading(false));
    }

    const refreshUsersList = () => fetchAllUsers();

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const splitFullName = (fullName: string) => {
        const parts = fullName.trim().split(/\s+/);
        const firstName = parts.shift();
        const lastName = parts.pop();
        const middleName = parts.join(" ");
        return { firstName, middleName, lastName };
    };

    function handleNameChage(name: string) {
        setNewOperatorName(name);
        const { lastName } = splitFullName(name);
        setIsSignUpCard(!!lastName);
    }

    const formatDate = (date: string | Date) => {
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="mt-6 md:mt-10 px-4 md:px-6 lg:px-8">

            {/* Header */}
            <div className="mb-5 flex flex-col sm:flex-row justify-between gap-4">
                <p className="text-lg md:text-xl lg:text-2xl font-semibold">
                    Total operators: {users.length}
                </p>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">New operator</Button>
                    </DialogTrigger>

                    <DialogContent className="bg-white w-[90vw] max-w-[400px]">
                        <Label className="mb-2 text-lg font-medium">Name</Label>
                        <Input
                            value={newOperatorName}
                            onChange={(e) => handleNameChage(e.target.value)}
                        />

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <DialogClose asChild>
                                <Button onClick={() => setOpen(false)}>Cancel</Button>
                            </DialogClose>

                            {isSignUpCard ? (
                                <OperatorRegister inPage nameOfOperator={newOperatorName} />
                            ) : (
                                <Button onClick={() => errorMessage("Please give your name")}>
                                    Next
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block">
                <div className="flex bg-[#ededed] p-4 rounded font-semibold text-lg justify-between overflow-x-auto">
                    {["Id", "Name", "Email", "Verified", "Status", "Joined at", "Updated at"].map(
                        (item) => (
                            <div
                                key={item}
                                className="min-w-[120px] flex items-center justify-between group"
                                onMouseEnter={() => setActiveHover(item)}
                                onMouseLeave={() => setActiveHover("")}
                            >
                                {activeHover === item ? item.slice(0, 4) + "..." : item}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                    <div className="w-7 h-7 flex items-center justify-center hover:bg-gray-300 rounded-full">
                                        <ArrowUpwardIcon fontSize="small" />
                                    </div>
                                    <div className="w-7 h-7 flex items-center justify-center hover:bg-gray-300 rounded-full">
                                        <MoreVertIcon fontSize="small" />
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>

                <div className="flex flex-col gap-3 mt-5">
                    {loading ? (
                        <p className="text-center py-8">Fetching operators...</p>
                    ) : users.length === 0 ? (
                        <div className="min-h-[60vh] flex justify-center items-center">
                            <Image src={NullImage} alt="No data" width={400} height={400} />
                        </div>
                    ) : (
                        users.map((details, index) => {
                            const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + " " : ""
                                }${details.user.last_name}`;

                            return (
                                <div
                                    key={details.id}
                                    onMouseEnter={() => setMailHover(index)}
                                    onMouseLeave={() => setMailHover(-1)}
                                    className="bg-[#f5f5f5] hover:bg-[#eeeeee] transition-colors duration-200 rounded-xl mx-3 px-2 py-2"
                                >


                                    <OperatorAction
                                        creatDate={formatDate(details.createdAt)}
                                        email={details.user.email}
                                        emailVerified={details.user.emailVerified}
                                        index={index}
                                        mailHover={mailHover}
                                        name={name}
                                        updateDate={formatDate(details.updatedAt)}
                                        status={details.Status}
                                        id={details.id}
                                        onUpdate={refreshUsersList}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Mobile */}
            <div className="lg:hidden">
                {loading ? (
                    <p className="text-center py-8">Fetching operators...</p>
                ) : users.length === 0 ? (
                    <div className="min-h-[50vh] flex justify-center items-center">
                        <Image src={NullImage} alt="No data" width={250} height={250} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {users.map((details, index) => {
                            const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + " " : ""
                                }${details.user.last_name}`;

                            return (
                                <div key={details.id} className="bg-white rounded-lg shadow p-4">
                                    <h3 className="font-semibold text-lg truncate">{name}</h3>
                                    <p className="text-sm text-gray-600">{details.user.email}</p>

                                    <div className="flex justify-between mt-2 text-sm">
                                        <span>Status:</span>
                                        <span
                                            className={
                                                details.Status === 1 ? "text-green-600" : "text-red-600"
                                            }
                                        >
                                            {details.Status === 1 ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="text-xs text-gray-500 mt-2">
                                        Joined: {formatDate(details.createdAt)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Updated: {formatDate(details.updatedAt)}
                                    </div>

                                    <div className="pt-3 mt-3 border-t">
                                        <OperatorAction
                                            creatDate={formatDate(details.createdAt)}
                                            email={details.user.email}
                                            emailVerified={details.user.emailVerified}
                                            index={index}
                                            mailHover={mailHover}
                                            name={name}
                                            updateDate={formatDate(details.updatedAt)}
                                            status={details.Status}
                                            id={details.id}
                                            onUpdate={refreshUsersList}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperatorSection;
