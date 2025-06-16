'use client'; // Needed for client-side interactivity

import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';

export default function Navbar() {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <nav className="navbar navbar-expand-lg fixed-top">
      <div className="container-fluid">
        <a className="navbar-brand me-auto" href="#">Logo</a>

        <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Logo</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body">
            <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
              <li className="nav-item">
                <Link className="nav-link active" href="/intro">Home</Link>
              </li>
              <li className="nav-item">
                <a className="nav-link mx-lg-2" href="#">Plans</a>
              </li>
              <li className="nav-item">
                <a className="nav-link mx-lg-2" href="#">Library</a>
              </li>
              <li className="nav-item">
                <a className="nav-link mx-lg-2" href="#">Community</a>
              </li>
              <li className="nav-item">
                <a className="nav-link mx-lg-2" href="#">About Us</a>
              </li>
            </ul>
          </div>
        </div>

        <Link href="/login" className="LoginSignup_Button">Login/SignUp</Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar">
          <span className="navbar-toggler-icon"></span>
        </button>
      </div>
    </nav>
  );
}
