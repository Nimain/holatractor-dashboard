"use client"

import { useState } from 'react'


interface Lead {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    time: string;
}

interface Column {
    id: number;
    title: string;
    leads: Lead[];
    statusColor: string;
}

const marketplace = () => {

    const [isOpen, setIsOpen] = useState(false);
    const [open, setOpen] = useState(false)
    const [currentLead, setCurrentLead] = useState(null);

    const toggleDialog = () => {
    setIsOpen(!isOpen);
};

  return (
    <div>marketplace</div>
  )
}

export default marketplace