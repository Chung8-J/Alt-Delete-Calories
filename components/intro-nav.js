'use client'; // Needed for client-side interactivity

import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import Footer from '../components/footer';

import '../style/common.css';

export default function Navbar() {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <nav className="navbar">
      <div className="container-fluid">
        <img src="/images/logo.png" alt="Alt+Calories Logo" className="Logo" />

        <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Logo</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
        </div>

        <Link href="/Login" className="LoginSignup_Button">Login/SignUp</Link>
      </div>
    </nav>
    
  );
}
