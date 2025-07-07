'use client';
import Navbar from './navbar';


export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="body" style={{paddingBottom:'20px'}}>{children}</main>
    </>
  );
}
