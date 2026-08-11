import React, { useState, useEffect } from 'react';
import { useForgotPasswordMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { ArrowPathIcon, EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import portalLogo from "../assets/portal_logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email address.'); return; }
    try {
      const result = await forgotPassword({ email }).unwrap();
      toast.success(result.message || 'Reset link sent!');
      setSent(true);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(180deg, #1a0a35 0%, #2d1654 40%, #48306A 80%, #5c3598 100%)', fontFamily: "'Manrope', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @keyframes fp-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fp-dot { 0%,100% { transform:translateY(0); opacity:0.4; } 50% { transform:translateY(-8px); opacity:0.9; } }
        .fp-card { animation: fp-fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .fp-dot { position:absolute; border-radius:50%; border:1.5px solid rgba(255,255,255,0.12); animation:fp-dot 4s ease-in-out infinite; }
        .fp-field {
          width: 100%;
          padding: 16px 20px;
          border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.06);
          color: white;
          font-size: 15px;
          font-family: 'Manrope', sans-serif;
          outline: none;
          transition: all 0.2s;
        }
        .fp-field:focus {
          border-color: rgba(142,95,208,0.6);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 4px rgba(142,95,208,0.12);
        }
        .fp-field::placeholder { color: rgba(255,255,255,0.35); }
        .fp-btn {
          width:100%; padding:16px; border-radius:50px; border:none;
          cursor:pointer; font-size:15px; font-weight:800; color:white;
          letter-spacing:0.04em; text-transform:uppercase;
          background:linear-gradient(135deg, #48306A 0%, #7c3aed 50%, #8E5FD0 100%);
          display:flex; align-items:center; justify-content:center; gap:8px;
          font-family:'Manrope',sans-serif;
          box-shadow:0 8px 30px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
          transition:all 0.2s;
          position:relative; overflow:hidden;
        }
        .fp-btn::before {
          content:''; position:absolute; top:0; left:-75%; width:50%; height:100%;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform:skewX(-20deg); transition:left 0.5s ease;
        }
        .fp-btn:hover:not(:disabled)::before { left:125%; }
        .fp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 40px rgba(124,58,237,0.6); }
        .fp-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      {/* Decorative dots */}
      <div className="fp-dot" style={{ width:10, height:10, top:'15%', left:'8%', animationDelay:'0s' }} />
      <div className="fp-dot" style={{ width:6, height:6, top:'40%', left:'5%', animationDelay:'0.8s' }} />
      <div className="fp-dot" style={{ width:14, height:14, top:'65%', left:'12%', animationDelay:'1.4s' }} />
      <div className="fp-dot" style={{ width:8, height:8, top:'20%', right:'10%', animationDelay:'0.6s' }} />
      <div className="fp-dot" style={{ width:12, height:12, top:'55%', right:'7%', animationDelay:'1.2s' }} />
      <div className="fp-dot" style={{ width:18, height:18, top:'75%', right:'15%', animationDelay:'0.3s' }} />

      <div className={`fp-card w-full`} style={{ maxWidth:'440px' }}>

        {/* Logo */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'28px' }}>
          <img src={portalLogo} alt="Work Radar" style={{ width:'220px', height:'220px', objectFit:'contain', filter:'drop-shadow(0 10px 44px rgba(142,95,208,0.65))' }} />
        </div>

        {/* Success state */}
        {sent ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(72,210,150,0.15)', border:'2px solid rgba(72,210,150,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <CheckCircleIcon style={{ width:'36px', height:'36px', color:'#48d296' }} />
            </div>
            <h2 style={{ color:'white', fontWeight:800, fontSize:'26px', marginBottom:'10px' }}>Check your email</h2>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'14px', lineHeight:1.7, marginBottom:'32px' }}>
              We've sent a password reset link to <strong style={{ color:'rgba(255,255,255,0.85)' }}>{email}</strong>. Check your inbox and follow the instructions.
            </p>
            <Link to="/login"
              style={{ display:'inline-flex', alignItems:'center', gap:'8px', color:'#c084fc', fontWeight:700, fontSize:'14px', textDecoration:'none' }}>
              <ArrowLeftIcon style={{ width:'16px', height:'16px' }} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Title */}
            <div style={{ textAlign:'center', marginBottom:'32px' }}>
              <h1 style={{ color:'white', fontWeight:800, fontSize:'32px', lineHeight:1.2, marginBottom:'10px' }}>Forgot Password?</h1>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'14px', lineHeight:1.7 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:'rgba(192,132,252,0.9)', marginBottom:'8px', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  Email Address
                </label>
                <div style={{ position:'relative' }}>
                  <EnvelopeIcon style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', width:'18px', height:'18px', color:'#c084fc', pointerEvents:'none' }} />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="fp-field"
                    style={{ paddingLeft:'48px' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="fp-btn">
                {isLoading
                  ? <><ArrowPathIcon style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }} /> Sending...</>
                  : 'Send Reset Link'
                }
              </button>
            </form>

            {/* Back link */}
            <div style={{ textAlign:'center', marginTop:'24px' }}>
              <Link to="/login"
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.45)', fontWeight:600, fontSize:'13px', textDecoration:'none' }}>
                <ArrowLeftIcon style={{ width:'14px', height:'14px' }} /> Back to Sign In
              </Link>
            </div>
          </>
        )}

        <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'36px' }}>
          &copy; {new Date().getFullYear()} Work Radar. All rights reserved.
        </p>
      </div>

      {/* Bottom waves */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:0, lineHeight:0, pointerEvents:'none' }}>
        <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', width:'100%' }}>
          <path d="M0,80 C200,40 400,100 600,70 C800,40 1000,90 1200,60 C1320,45 1400,75 1440,65 L1440,120 L0,120 Z" fill="rgba(72,48,106,0.5)" />
          <path d="M0,95 C180,65 360,110 540,85 C720,60 900,100 1080,75 C1250,52 1380,88 1440,78 L1440,120 L0,120 Z" fill="rgba(92,53,152,0.45)" />
          <path d="M0,105 C160,80 320,112 480,92 C640,72 800,108 960,88 C1120,68 1300,100 1440,90 L1440,120 L0,120 Z" fill="rgba(142,95,208,0.35)" />
        </svg>
      </div>
    </div>
  );
};

export default ForgotPassword;
