'use client';

import { RootState } from '@/redux/store';
import { ReactNode, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from '../sidebar/Sidebar';

interface SidebarWrapperProps {
  children: ReactNode;
}

const SidebarWrapper = ({ children }: SidebarWrapperProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { sidebarShow } = useSelector((root: RootState) => root.SidebarShow);

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      const target = e.currentTarget as HTMLDivElement;
      target.scrollTop += e.deltaY;
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener('wheel', handleScroll);
    }

    return () => {
      if (section) {
        section.removeEventListener('wheel', handleScroll);
      }
    };
  }, []);

  return (
    <div className="w-full min-h-[100vh] max-h-fit flex">
      <Sidebar />
      <div
        className={`transition-all duration-500 h-screen overflow-auto ${sidebarShow ? 'pl-[190px]' : 'pl-0'} w-full`}
        style={{
          scrollbarWidth: 'none',
        }}
        ref={sectionRef}
      >
        {children}
      </div>
    </div>
  );
};

export default SidebarWrapper;
