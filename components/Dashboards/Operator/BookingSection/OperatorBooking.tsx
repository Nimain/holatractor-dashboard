"use client";

import { useState } from 'react';
import { MoreHorizontal, MessageSquare, Users, ChevronDown, Plus, Calendar, Clock, MapPin, Tractor, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const KanbanBoard = () => {
    const today = new Date()
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    const [columns, setColumns] = useState([
        {
            title: 'New booking',
            tasks: [
                {
                    id: 1,
                    bookingId: 'BOOK-001',
                    title: 'Farm Equipment Booking',
                    date: '2024-12-01',
                    hours: 4,
                    tractorName: 'John Deere 5E',
                    attachmentName: 'Rotavator',
                    location: 'Field 7, West Farm',
                    secondaryTag: 'client',
                    progress: 25,
                    comments: 1,
                    members: 2,
                    color: 'bg-purple-200'
                },
                {
                    id: 2,
                    bookingId: 'BOOK-002',
                    title: 'Equipment Rental',
                    date: '2024-12-02',
                    hours: 6,
                    tractorName: 'Mahindra 575',
                    attachmentName: 'Plough',
                    location: 'Field 3, East Farm',
                    secondaryTag: 'client',
                    progress: 15,
                    comments: 1,
                    members: 1,
                    color: 'bg-blue-100'
                },
            ]
        },
        {
            title: 'In Progress',
            tasks: [
                {
                    id: 3,
                    bookingId: 'BOOK-003',
                    title: 'Tractor Service',
                    date: '2024-12-01',
                    hours: 8,
                    tractorName: 'New Holland 3630',
                    attachmentName: 'Harvester',
                    location: 'Field 1, South Farm',
                    secondaryTag: 'product',
                    progress: 90,
                    comments: 1,
                    members: 2,
                    color: 'bg-orange-100'
                },
            ]
        },
        {
            title: 'Transction',
            tasks: [
                {
                    id: 4,
                    storeName: 'Farm Supply Co.',
                    comments: 12,
                    members: 2,
                    color: 'bg-yellow-200'
                },
            ]
        },
        {
            title: 'Done',
            tasks: [
                {
                    id: 5,
                    bookingId: 'BOOK-005',
                    title: 'Regular Service',
                    date: '2024-11-30',
                    hours: 3,
                    tractorName: 'Massey Ferguson 241',
                    attachmentName: 'Cultivator',
                    location: 'Field 2, Central Farm',
                    secondaryTag: 'client',
                    progress: 100,
                    comments: 1,
                    members: 2,
                    color: 'bg-green-200'
                },
            ]
        }
    ]);

    const handleAccept = (taskId) => {
        setColumns(prevColumns => {
            const newColumns = [...prevColumns];
            const newBookingColumn = newColumns.find(col => col.title === 'New booking');
            const taskToMove = newBookingColumn.tasks.find(task => task.id === taskId);

            if (taskToMove) {
                newBookingColumn.tasks = newBookingColumn.tasks.filter(task => task.id !== taskId);
                const inProgressColumn = newColumns.find(col => col.title === 'In Progress');
                inProgressColumn.tasks.push(taskToMove);
            }

            return newColumns;
        });
    };

    const handleDecline = (taskId) => {
        setColumns(prevColumns => {
            const newColumns = [...prevColumns];
            const newBookingColumn = newColumns.find(col => col.title === 'New booking');
            newBookingColumn.tasks = newBookingColumn.tasks.filter(task => task.id !== taskId);
            return newColumns;
        });
    };

    const ProgressDots = ({ progress, color = 'blue' }) => {
        const totalDots = 10;
        const filledDots = Math.round((progress / 100) * totalDots);

        return (
            <div className="flex gap-1 w-full justify-between">
                {[...Array(totalDots)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-5 h-5 rounded-full ${i < filledDots ? `bg-${color}-500` : 'bg-gray-200'}`}
                    />
                ))}
            </div>
        );
    };

    const TaskCard = ({ task, columnTitle }) => {
        if (columnTitle === 'Transction') {
            return (
                <div className={`${task.color} rounded-xl p-4 mb-4 shadow-sm`}>
                    <div className="flex justify-between items-start mb-3">
                        <Button
                            variant="default"
                            className="w-full mb-2 flex items-center justify-center gap-2"
                            onClick={() => {/* Add send bill functionality */ }}
                        >
                            <Send size={16} />
                            Send Bill
                        </Button>

                    </div>

                    <div className="bg-white p-3 rounded-lg mb-4">
                        <h3 className="font-medium text-gray-800">{task.storeName}</h3>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex -space-x-2">
                            {[...Array(task.members)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-gray-600">
                                <MessageSquare size={16} />
                                <span className="text-sm">{task.comments}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                                <Users size={16} />
                                <span className="text-sm">{task.members}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`${task.color} rounded-xl p-4 mb-4 shadow-sm`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="space-y-2">
                        {columnTitle === 'New booking' && (
                            <div className="flex gap-2 mt-4">
                                <Button
                                    onClick={() => handleAccept(task.id)}
                                    variant="default"
                                    className="w-full"
                                >
                                    Accept
                                </Button>
                                <Button
                                    onClick={() => handleDecline(task.id)}
                                    variant="destructive"
                                    className="w-full"
                                >
                                    Decline
                                </Button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">Booking ID:</span>
                            <span>{task.bookingId}</span>
                        </div>
                        <h3 className="font-medium text-gray-800">{task.title}</h3>
                    </div>
                    <button className="text-gray-500 hover:bg-white/50 rounded-full p-1">
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                            <Calendar size={14} />
                        </div>
                        <span>{task.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                            <Clock size={14} />
                        </div>
                        <span>{task.hours} hours</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                            <Tractor size={14} />
                        </div>
                        <span>{task.tractorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                            <Paperclip size={14} />
                        </div>
                        <span>{task.attachmentName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                            <MapPin size={14} />
                        </div>
                        <span>{task.location}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="">
                        <ProgressDots
                            progress={task.progress}
                            color={task.color.includes('blue') ? 'blue' :
                                task.color.includes('purple') ? 'purple' :
                                    task.color.includes('pink') ? 'pink' :
                                        task.color.includes('orange') ? 'orange' :
                                            task.color.includes('green') ? 'green' : 'red'}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex -space-x-2">
                            {[...Array(task.members)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-gray-600">
                                <Tractor size={16} />
                                <span className="text-sm">{task.comments}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                                <Paperclip size={16} />
                                <span className="text-sm">{task.members}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-8 flex justify-between items-center border-b border-gray-200 pb-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-xl font-bold">{monthNames[today.getMonth()]}</h1>
                        <p className="text-gray-600 text-sm">
                            {dayNames[today.getDay()]}, {today.getDate()} {today.getFullYear()}
                        </p>
                    </div>
                    <div className="h-6 w-px bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">Booking</h2>
                        <ChevronDown size={20} className="text-gray-400" />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white ring-2 ring-white"
                            />
                        ))}
                    </div>
                    <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors">
                        Apply
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {columns.map((column, index) => (
                    <div key={index} className="space-y-4 border border-gray-300 p-4 rounded-[25px]">
                        <div className="flex items-center justify-between">
                            <h2 className="font-medium text-gray-900 flex items-center gap-2">
                                <span className="text-gray-400">▸</span>
                                {column.title}
                            </h2>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                                    <Plus size={16} className="text-gray-400" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                                    <MoreHorizontal size={16} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {column.tasks.map((task, taskIndex) => (
                                <TaskCard key={taskIndex} task={task} columnTitle={column.title} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;