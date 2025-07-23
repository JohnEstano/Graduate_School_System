import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import IndiviualRecord from './individual-record';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Eye
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Honorarium',
    href: '/honorarium',
  },
  {
    title: 'Honorarium Submission',
    href: '/honorarium-submission',
  },
];



export default function Index() {


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Honorarium Summary" />

      <div className="flex-row justify-between mt-5 ml-10">
        <h1 className='text-xl font-extrabold tracking-tight '>Admin User</h1>
        <p className='text-6'>User</p>
      </div>


   {/* Flex container for button alignment and wrapping */}
    <div className="flex flex-wrap justify-center gap-4 py-6">
        {/* Button Styling Breakdown:
            - p-3: Padding on all sides
            - px-5: Horizontal padding for more width
            - bg-blue-600: Background color
            - text-white: Text color
            - font-semibold: Medium font weight
            - rounded-lg: Rounded corners
            - shadow-md: Drop shadow
            - hover:bg-blue-700: Darker background on hover
            - focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500: Accessibility focus state
            - transition-all duration-200: Smooth transition for hover and active states
            - active:scale-95: Shrink effect on click
        */}
        <button className="p-3 px-30 h-25 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-100">Button 1</button>
        <button className="p-3 px-30 h-25 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-100">Button 2</button>
        <button className="p-3 px-30 h-25 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-100">Button 3</button>
        <button className="p-3 px-30 h-25 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-100">Button 4</button>            
        <button className="p-3 px-30 h-25 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-100">Button 1</button>
        <button className="p-3 px-30 h-25 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-100">Button 2</button>
        <button className="p-3 px-30 h-25 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-100">Button 3</button>
        <button className="p-3 px-30 h-25 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-100">Button 4</button>           
        <button className="p-3 px-30 h-25 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-100">Button 4</button>  
      
    </div>

  


    </AppLayout>
  );
}

