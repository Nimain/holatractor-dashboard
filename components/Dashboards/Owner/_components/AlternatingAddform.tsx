"use client";

import { useState, useEffect } from 'react';
import AddTractor from './AddTractor';
import AddAttachment from './AddAttachment';
import { TractorInStore, AttachmentInStore } from '@/utils/Types/types';

interface AlternatingAddFormProps {
  tractors: TractorInStore[];
  attachments: AttachmentInStore[];
}

const AlternatingAddForm: React.FC<AlternatingAddFormProps> = ({ tractors, attachments }) => {
  const [showTractor, setShowTractor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowTractor(prev => !prev);
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    return () => clearInterval(interval);
  }, []);

  if(showTractor) return <AddTractor alreadyTractors={tractors} />

  return (
        <AddAttachment alreadyAttachments={attachments} />
  );
};

export default AlternatingAddForm;
