import { createFileRoute } from '@tanstack/react-router';
import { AdminPage } from './admin';
export const Route=createFileRoute('/101')({ssr:false,head:()=>({meta:[{title:'Tesla — Control Room'},{name:'description',content:'Private Tesla management for verified administrators.'},{property:'og:title',content:'Tesla — Control Room'},{property:'og:description',content:'Private Tesla administration.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:AdminPage});
