'use client';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-20 px-6">{children}</main>
    </>
  );
}
