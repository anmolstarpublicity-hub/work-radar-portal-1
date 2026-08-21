import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  ArrowPathIcon, EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { useLoginMutation } from "../services/EmployeApi";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../app/authSlice";
import portalLogo from "../assets/portal_logo.png";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good Morning";
  if (h >= 12 && h < 18) return "Good Afternoon";
  return "Good Evening";
};

const Login = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const isMounted = useRef(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => { clearTimeout(t); isMounted.current = false; };
  }, []);

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !password) { toast.error("Please enter both employee ID and password."); return; }
    setShowLoader(true);
    const loaderStart = Date.now();
    try {
      const userData = await login({ employeeId, password }).unwrap();
      // Keep loader visible for at least 2.5 seconds
      const elapsed = Date.now() - loaderStart;
      const remaining = Math.max(0, 2000 - elapsed);
      await new Promise(res => setTimeout(res, remaining));
      dispatch(setCredentials(userData));
      toast.success(`Welcome back, ${userData.user.name}!`);
      const d = userData.user?.dashboardAccess || "Employee Dashboard";
      if (d === "Admin Dashboard") navigate("/admin-dashboard");
      else if (d === "Manager Dashboard") navigate("/manager-dashboard");
      else navigate("/employee-dashboard");
    } catch (err) {
      const elapsed = Date.now() - loaderStart;
      const remaining = Math.max(0, 1500 - elapsed);
      await new Promise(res => setTimeout(res, remaining));
      setShowLoader(false);
      if (err?.status === 401) toast.error("Invalid credentials. Please check your ID and password.");
      else toast.error(err.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div
      className="h-screen min-h-[100svh] font-manrope relative overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg, #1a0a35 0%, #2d1654 40%, #48306A 80%, #5c3598 100%)' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .font-manrope { font-family: 'Manrope', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoPulse {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes floatDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-10px); opacity: 0.8; }
        }
        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-logo {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes overlay-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .loading-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          background: linear-gradient(160deg, #1a0a35 0%, #2d1654 50%, #48306A 100%);
          animation: overlay-fade-in 0.3s ease both;
        }
        .loading-ring {
          position: absolute;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #8E5FD0;
          border-right-color: rgba(142,95,208,0.4);
          animation: spin-ring 0.9s linear infinite;
        }
        .loading-ring-outer {
          position: absolute;
          width: 134px;
          height: 134px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(142,95,208,0.25);
          border-left-color: rgba(192,132,252,0.2);
          animation: spin-ring 1.4s linear infinite reverse;
        }
        .loading-logo {
          animation: pulse-logo 1.5s ease-in-out infinite;
        }
        .loading-text {
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.06em;
          font-family: 'Manrope', sans-serif;
        }
        .loading-dots span {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(142,95,208,0.8);
          margin: 0 3px;
          animation: floatDot 1.2s ease-in-out infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        .anim-fade-up { animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }

        /* Logo animation */
        .logo-pulse { animation: logoPulse 4s ease-in-out infinite; will-change: transform; }

        .login-input {
          width: 100%;
          box-sizing: border-box;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.06);
          color: white;
          font-size: 14px;
          font-family: 'Manrope', sans-serif;
          outline: none;
          transition: all 0.2s;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.35); }
        .login-input:focus {
          border-color: rgba(142,95,208,0.6);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 4px rgba(142,95,208,0.12);
        }
        .login-input-wrap {
          position: relative;
        }
        .login-btn {
          width: 100%;
          box-sizing: border-box;
          padding: 15px 20px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg, #48306A 0%, #7c3aed 50%, #8E5FD0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: 'Manrope', sans-serif;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(124,58,237,0.5), 0 2px 8px rgba(72,48,106,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: all 0.2s ease;
        }
        .login-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: skewX(-20deg);
          transition: left 0.5s ease;
        }
        .login-btn:hover:not(:disabled)::before {
          left: 125%;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 16px 48px rgba(124,58,237,0.6), 0 4px 12px rgba(72,48,106,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(124,58,237,0.45);
        }
        .btn-spinner {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.22);
          border-top-color: rgba(255,255,255,0.95);
          display: inline-block;
          animation: spinSlow 0.95s linear infinite;
        }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Floating decorative dots */
        .dot { position: absolute; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.15); animation: floatDot 4s ease-in-out infinite; }
        .login-title-wrap { margin-top: -22px; }

        @media (max-width: 640px) {
          .dot { display: none; }
          .login-panel { padding: 12px 16px 24px !important; min-height: 0; }
          .login-panel > div { max-width: 320px !important; }
          .login-logo { width: 92px !important; height: 92px !important; margin-bottom: 4px !important; }
          .login-title-wrap { margin-top: -14px; }
          .login-title { font-size: 20px !important; }
          .login-subtitle { font-size: 10px !important; }
          .login-form { gap: 10px !important; }
          .login-form .login-input,
          .login-form .login-btn { font-size: 12px; }
          .login-form .login-input { padding: 10px 12px; }
          .login-form .login-btn { padding: 11px 16px; }
          .login-forgot { font-size: 10px !important; }
          .login-form + .login-footer { font-size: 9px !important; }
          .login-footer { margin-top: 12px !important; }
          .login-wave { display: none; }
        }

        @media (max-height: 700px) and (min-width: 641px) {
          .login-logo { width: 130px !important; height: 130px !important; margin-bottom: 8px !important; }
          .login-panel { padding-top: 10px !important; padding-bottom: 20px !important; }
        }
      `}</style>

      {/* ── Full-screen loading overlay with logo ── */}
      {showLoader && (
        <div className="loading-overlay">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '140px', height: '140px' }}>
            <div className="loading-ring-outer" />
            <div className="loading-ring" />
            <img src={portalLogo} alt="Work Radar" className="loading-logo"
              style={{ width: '64px', height: '64px', objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(142,95,208,0.6))', position: 'relative', zIndex: 1 }} />
          </div>
          <p className="loading-text">Signing you in</p>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      {/* Decorative floating dots */}
      <div className="dot" style={{ width:10, height:10, top:'18%', left:'8%', animationDelay:'0s' }} />
      <div className="dot" style={{ width:6, height:6, top:'35%', left:'15%', animationDelay:'0.8s' }} />
      <div className="dot" style={{ width:14, height:14, top:'55%', left:'5%', animationDelay:'1.4s' }} />
      <div className="dot" style={{ width:8, height:8, top:'72%', left:'20%', animationDelay:'0.4s' }} />
      <div className="dot" style={{ width:12, height:12, top:'20%', right:'10%', animationDelay:'0.6s' }} />
      <div className="dot" style={{ width:6, height:6, top:'40%', right:'6%', animationDelay:'1.2s' }} />
      <div className="dot" style={{ width:10, height:10, top:'60%', right:'15%', animationDelay:'0.2s' }} />
      <div className="dot" style={{ width:16, height:16, top:'75%', right:'8%', animationDelay:'1s' }} />
      {/* Open circles */}
      <div style={{ position:'absolute', width:24, height:24, top:'25%', left:'28%', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)', animation:'floatDot 5s ease-in-out infinite 0.3s' }} />
      <div style={{ position:'absolute', width:18, height:18, top:'65%', right:'28%', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)', animation:'floatDot 6s ease-in-out infinite 1.1s' }} />
      <div style={{ position:'absolute', width:30, height:30, top:'45%', left:'32%', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.08)', animation:'floatDot 7s ease-in-out infinite 0.7s' }} />

      {/* Centered form */}
      <div className="login-panel" style={{ flex:1, minHeight:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', zIndex:10 }}>
        <div style={{ width:'100%', maxWidth:'400px' }}>

          {/* Logo */}
          <div className={`${mounted ? 'anim-fade-up delay-1' : 'opacity-0'} flex justify-center mb-1`}>
            <img src={portalLogo} alt="" className="logo-pulse login-logo" style={{ width:'150px', height:'150px', objectFit:'contain', filter:'drop-shadow(0 10px 44px rgba(142,95,208,0.65))' }} />
          </div>

          {/* Title */}
          <div className={`${mounted ? 'anim-fade-up delay-2' : 'opacity-0'} text-center mb-1 login-title-wrap`}>
            <h1 className="login-title" style={{ color:'white', fontWeight:700, fontSize:'30px', lineHeight:1.2, letterSpacing:'-0.02em' }}>
              {getGreeting()}
            </h1>
          </div>

          <div className={`${mounted ? 'anim-fade-up delay-3' : 'opacity-0'} text-center mb-10`}>
            <p className="login-subtitle" style={{ color:'rgba(255,255,255,0.45)', fontSize:'13px' }}>
              Sign in and start tracking your performance!
            </p>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Employee ID */}
            <div className={`${mounted ? 'anim-fade-up delay-3' : 'opacity-0'} login-input-wrap`}>
              <input
                type="text"
                autoComplete="off"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Employee ID"
                className="login-input"
              />
            </div>

            {/* Password */}
            <div className={`${mounted ? 'anim-fade-up delay-4' : 'opacity-0'} login-input-wrap`}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="login-input"
                style={{ paddingRight:'52px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position:'absolute', right:'16px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex', padding:0 }}>
                {showPassword ? <EyeSlashIcon style={{ width:'18px', height:'18px' }} /> : <EyeIcon style={{ width:'18px', height:'18px' }} />}
              </button>
            </div>

            {/* Forgot password */}
            <div className={`${mounted ? 'anim-fade-up delay-4' : 'opacity-0'}`}
              style={{ display:'flex', justifyContent:'flex-end' }}>
              <Link to="/forgot-password" className="login-forgot"
                style={{ fontSize:'13px', fontWeight:600, color:'#c084fc', textDecoration:'none' }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <div className={`${mounted ? 'anim-fade-up delay-5' : 'opacity-0'}`}>
              <button type="submit" disabled={isLoading || showLoader} className="login-btn">
                {(isLoading || showLoader)
                  ? <><span className="btn-spinner" aria-hidden="true" /> Signing In...</>
                  : <><ArrowRightOnRectangleIcon style={{ width:'20px', height:'20px' }} /> Sign In</>
                }
              </button>
            </div>
          </form>

          <p className={`${mounted ? 'anim-fade-up delay-5' : 'opacity-0'} text-center login-footer`}
            style={{ marginTop:'32px', fontSize:'12px', color:'#ffffff' }}>
            &copy; {new Date().getFullYear()} Work Radar. All rights reserved.
          </p>
        </div>
      </div>

      {/* Bottom wave decoration — animated tall purple waves */}
      <div className="login-wave" style={{ position:'absolute', left:0, right:0, bottom:0, zIndex:5, lineHeight:0, pointerEvents:'none' }}>
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', width:'100%', height:'150px' }}>
          <defs>
            <style>{`
              @keyframes wave-back {
                0% { d: path("M0,160 C180,80 360,240 540,160 C720,80 900,240 1080,160 C1260,80 1380,200 1440,160 L1440,320 L0,320 Z"); }
                50% { d: path("M0,200 C200,100 400,280 600,190 C800,100 1000,260 1200,180 C1340,120 1400,220 1440,200 L1440,320 L0,320 Z"); }
                100% { d: path("M0,160 C180,80 360,240 540,160 C720,80 900,240 1080,160 C1260,80 1380,200 1440,160 L1440,320 L0,320 Z"); }
              }
              @keyframes wave-mid {
                0% { d: path("M0,200 C200,120 400,260 600,190 C800,120 1000,250 1200,180 C1340,140 1400,210 1440,195 L1440,320 L0,320 Z"); }
                50% { d: path("M0,170 C180,100 360,230 540,170 C720,110 900,230 1080,170 C1260,110 1380,190 1440,170 L1440,320 L0,320 Z"); }
                100% { d: path("M0,200 C200,120 400,260 600,190 C800,120 1000,250 1200,180 C1340,140 1400,210 1440,195 L1440,320 L0,320 Z"); }
              }
              @keyframes wave-front {
                0% { d: path("M0,230 C160,170 320,270 480,220 C640,170 800,260 960,218 C1120,176 1300,248 1440,225 L1440,320 L0,320 Z"); }
                50% { d: path("M0,210 C180,160 340,260 500,210 C660,160 820,250 980,205 C1140,160 1310,240 1440,215 L1440,320 L0,320 Z"); }
                100% { d: path("M0,230 C160,170 320,270 480,220 C640,170 800,260 960,218 C1120,176 1300,248 1440,225 L1440,320 L0,320 Z"); }
              }
              .wave-back { animation: wave-back 6s ease-in-out infinite; }
              .wave-mid  { animation: wave-mid  5s ease-in-out infinite 0.5s; }
              .wave-front{ animation: wave-front 4s ease-in-out infinite 1s; }
            `}</style>
          </defs>
          {/* Back wave — darkest purple */}
          <path className="wave-back"
            d="M0,160 C180,80 360,240 540,160 C720,80 900,240 1080,160 C1260,80 1380,200 1440,160 L1440,320 L0,320 Z"
            fill="rgba(72,48,106,0.7)" />
          {/* Middle wave */}
          <path className="wave-mid"
            d="M0,200 C200,120 400,260 600,190 C800,120 1000,250 1200,180 C1340,140 1400,210 1440,195 L1440,320 L0,320 Z"
            fill="rgba(92,53,152,0.6)" />
          {/* Front wave — most visible */}
          <path className="wave-front"
            d="M0,230 C160,170 320,270 480,220 C640,170 800,260 960,218 C1120,176 1300,248 1440,225 L1440,320 L0,320 Z"
            fill="rgba(142,95,208,0.55)" />
        </svg>
      </div>
    </div>
  );
};

export default Login;
