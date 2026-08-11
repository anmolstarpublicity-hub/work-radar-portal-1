import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useResetPasswordMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import { ArrowPathIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import portalLogo from "../assets/portal_logo.png";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters long."); return; }
    try {
      await resetPassword({ token, password }).unwrap();
      toast.success("Password reset successfully!");
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.data?.message || "Failed to reset password. The link may be invalid or expired.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(180deg, #1a0a35 0%, #2d1654 40%, #48306A 80%, #5c3598 100%)', fontFamily: "'Manrope', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @keyframes rp-fade-up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes rp-dot { 0%,100% { transform:translateY(0); opacity:0.4; } 50% { transform:translateY(-8px); opacity:0.9; } }
        .rp-card { animation: rp-fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .rp-dot { position:absolute; border-radius:50%; border:1.5px solid rgba(255,255,255,0.12); animation:rp-dot 4s ease-in-out infinite; }
        .rp-field {
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
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rp-field:focus-within {
          border-color: rgba(142,95,208,0.6);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 4px rgba(142,95,208,0.12);
        }
        .rp-field input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 15px; color: white; font-family: 'Manrope', sans-serif;
        }
        .rp-field input::placeholder { color: rgba(255,255,255,0.35); }
        .rp-btn {
          width:100%; padding:16px; border-radius:50px; border:none;
          cursor:pointer; font-size:15px; font-weight:800; color:white;
          letter-spacing:0.04em; text-transform:uppercase;
          background:linear-gradient(135deg, #48306A 0%, #7c3aed 50%, #8E5FD0 100%);
          display:flex; align-items:center; justify-content:center; gap:8px;
          font-family:'Manrope',sans-serif;
          box-shadow:0 8px 30px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
          transition:all 0.2s; position:relative; overflow:hidden;
        }
        .rp-btn::before {
          content:''; position:absolute; top:0; left:-75%; width:50%; height:100%;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform:skewX(-20deg); transition:left 0.5s ease;
        }
        .rp-btn:hover:not(:disabled)::before { left:125%; }
        .rp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 40px rgba(124,58,237,0.6); }
        .rp-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      {/* Decorative dots */}
      <div className="rp-dot" style={{ width:10, height:10, top:'15%', left:'8%' }} />
      <div className="rp-dot" style={{ width:6, height:6, top:'40%', left:'5%', animationDelay:'0.8s' }} />
      <div className="rp-dot" style={{ width:14, height:14, top:'65%', left:'12%', animationDelay:'1.4s' }} />
      <div className="rp-dot" style={{ width:8, height:8, top:'20%', right:'10%', animationDelay:'0.6s' }} />
      <div className="rp-dot" style={{ width:12, height:12, top:'55%', right:'7%', animationDelay:'1.2s' }} />

      <div className="rp-card w-full" style={{ maxWidth:'440px' }}>

        {/* Logo */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'28px' }}>
          <img src={portalLogo} alt="Work Radar" style={{ width:'220px', height:'220px', objectFit:'contain', filter:'drop-shadow(0 10px 44px rgba(142,95,208,0.65))' }} />
        </div>

        {/* Success state */}
        {success ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(72,210,150,0.15)', border:'2px solid rgba(72,210,150,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <CheckCircleIcon style={{ width:'36px', height:'36px', color:'#48d296' }} />
            </div>
            <h2 style={{ color:'white', fontWeight:800, fontSize:'26px', marginBottom:'10px' }}>Password Reset!</h2>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'14px', lineHeight:1.7, marginBottom:'8px' }}>
              Your password has been reset successfully.
            </p>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'13px' }}>Redirecting you to sign in...</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign:'center', marginBottom:'32px' }}>
              <h1 style={{ color:'white', fontWeight:800, fontSize:'32px', lineHeight:1.2, marginBottom:'10px' }}>Reset Password</h1>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'14px', lineHeight:1.7 }}>
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

              {/* New Password */}
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:'rgba(192,132,252,0.9)', marginBottom:'8px', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  New Password
                </label>
                <div className="rp-field">
                  <span style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(142,95,208,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <LockClosedIcon style={{ width:'16px', height:'16px', color:'#c084fc' }} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex', padding:0, flexShrink:0 }}>
                    {showPassword ? <EyeSlashIcon style={{ width:'16px', height:'16px' }} /> : <EyeIcon style={{ width:'16px', height:'16px' }} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:'rgba(192,132,252,0.9)', marginBottom:'8px', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  Confirm New Password
                </label>
                <div className="rp-field">
                  <span style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(142,95,208,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <LockClosedIcon style={{ width:'16px', height:'16px', color:'#c084fc' }} />
                  </span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex', padding:0, flexShrink:0 }}>
                    {showConfirm ? <EyeSlashIcon style={{ width:'16px', height:'16px' }} /> : <EyeIcon style={{ width:'16px', height:'16px' }} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="rp-btn">
                {isLoading
                  ? <><ArrowPathIcon style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }} /> Resetting...</>
                  : 'Reset Password'
                }
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:'24px' }}>
              <Link to="/login"
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.45)', fontWeight:600, fontSize:'13px', textDecoration:'none' }}>
                <ArrowLeftIcon style={{ width:'14px', height:'14px' }} /> Back to Sign In
              </Link>
            </div>
          </>
        )}

        <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.2)', marginTop:'36px' }}>
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

export default ResetPassword;
