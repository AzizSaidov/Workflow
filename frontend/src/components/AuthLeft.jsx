import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Globe from './Globe'
import { statsApi } from '../api/stats'

// Sun rays: angle = CSS rotate() from vertical-down, sun is at top-right
// Negative = rotate left, positive = rotate right
const SUN_RAYS = [
  { a: -84, w: 8,  op: 0.17, bl: 5,  dur: 4.5, dl: 0.0 },
  { a: -76, w: 4,  op: 0.10, bl: 2,  dur: 5.8, dl: 0.4 },
  { a: -68, w: 18, op: 0.26, bl: 12, dur: 3.7, dl: 0.9 },
  { a: -60, w: 5,  op: 0.11, bl: 3,  dur: 6.4, dl: 0.2 },
  { a: -52, w: 22, op: 0.29, bl: 15, dur: 4.1, dl: 1.3 },
  { a: -44, w: 6,  op: 0.13, bl: 4,  dur: 5.2, dl: 0.7 },
  { a: -36, w: 14, op: 0.22, bl: 9,  dur: 3.9, dl: 1.6 },
  { a: -28, w: 4,  op: 0.09, bl: 2,  dur: 6.1, dl: 0.1 },
  { a: -20, w: 19, op: 0.25, bl: 13, dur: 4.8, dl: 1.0 },
  { a: -12, w: 5,  op: 0.12, bl: 3,  dur: 5.5, dl: 0.5 },
  { a:  -4, w: 24, op: 0.28, bl: 16, dur: 4.0, dl: 1.8 },
  { a:   4, w: 4,  op: 0.09, bl: 2,  dur: 5.9, dl: 0.3 },
  { a:  12, w: 11, op: 0.17, bl: 7,  dur: 4.3, dl: 1.1 },
  { a:  20, w: 7,  op: 0.14, bl: 5,  dur: 5.0, dl: 0.8 },
]

// Moon rays: soft, barely visible
const MOON_RAYS = [
  { a: -42, w: 6,  op: 0.055, bl: 5 },
  { a: -34, w: 3,  op: 0.038, bl: 3 },
  { a: -26, w: 9,  op: 0.065, bl: 8 },
  { a: -18, w: 4,  op: 0.042, bl: 3 },
  { a: -10, w: 12, op: 0.072, bl: 11 },
  { a:  -2, w: 3,  op: 0.035, bl: 2 },
  { a:   6, w: 7,  op: 0.048, bl: 6 },
  { a: -50, w: 4,  op: 0.030, bl: 3 },
]

const STARS = [
  { t: '5%',  l: '18%', s: 1.8, d: 2.8, dl: 0.0 },
  { t: '11%', l: '62%', s: 2.3, d: 3.6, dl: 0.8 },
  { t: '3%',  l: '42%', s: 1.1, d: 4.3, dl: 1.5 },
  { t: '19%', l: '31%', s: 1.6, d: 2.5, dl: 0.4 },
  { t: '8%',  l: '77%', s: 1.0, d: 5.1, dl: 2.1 },
  { t: '29%', l: '8%',  s: 1.5, d: 3.3, dl: 1.0 },
  { t: '15%', l: '52%', s: 2.1, d: 4.6, dl: 0.6 },
  { t: '22%', l: '73%', s: 1.2, d: 2.9, dl: 1.7 },
  { t: '2%',  l: '29%', s: 0.9, d: 3.9, dl: 2.5 },
  { t: '36%', l: '86%', s: 1.7, d: 4.2, dl: 0.7 },
  { t: '43%', l: '4%',  s: 1.0, d: 5.3, dl: 1.3 },
  { t: '52%', l: '90%', s: 2.2, d: 2.7, dl: 2.0 },
  { t: '60%', l: '14%', s: 1.3, d: 3.8, dl: 0.5 },
  { t: '68%', l: '80%', s: 1.9, d: 4.9, dl: 1.6 },
  { t: '76%', l: '25%', s: 1.0, d: 3.1, dl: 0.9 },
  { t: '84%', l: '68%', s: 2.4, d: 2.4, dl: 2.3 },
  { t: '91%', l: '5%',  s: 1.5, d: 4.4, dl: 1.1 },
  { t: '7%',  l: '87%', s: 1.1, d: 5.6, dl: 0.3 },
  { t: '47%', l: '47%', s: 1.4, d: 2.8, dl: 1.9 },
  { t: '56%', l: '60%', s: 1.8, d: 4.0, dl: 0.2 },
  { t: '33%', l: '38%', s: 1.2, d: 3.4, dl: 1.4 },
  { t: '72%', l: '44%', s: 1.6, d: 5.0, dl: 0.8 },
]

function Badge({ isDark, style, iconBg, icon, value, label, animStyle }) {
  return (
    <div style={{ position: 'absolute', ...style, zIndex: 5, animation: animStyle }}>
      <div style={{
        background: isDark ? 'rgba(5,5,16,0.86)' : 'rgba(255,255,255,0.78)',
        border: `0.5px solid ${iconBg}${isDark ? '44' : '60'}`,
        borderRadius: 14, padding: '10px 16px',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: isDark ? '0 4px 28px rgba(0,0,0,0.45)' : '0 4px 22px rgba(0,20,80,0.1)',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${iconBg}1E`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1, color: isDark ? '#fff' : '#0A1830' }}>
            {value}
          </div>
          <div style={{ fontSize: 10, marginTop: 3, whiteSpace: 'nowrap', color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,15,50,0.38)' }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthLeft({ isDark }) {
  const [locations, setLocations] = useState([])
  const [stats, setStats] = useState(null)
  const [onlineCount, setOnlineCount] = useState(null)

  useEffect(() => {
    statsApi.getUserLocations().then(r => setLocations(r.data || [])).catch(() => {})
    statsApi.getGlobal().then(r => setStats(r.data)).catch(() => {})
    statsApi.getOnlineCount().then(r => setOnlineCount(r.data?.count ?? 0)).catch(() => {})
  }, [])

  const freelancers = stats?.total_freelancers ?? null
  const completed = stats?.completed_projects ?? null

  return (
    <div style={{
      width: '52%', minHeight: '100vh', position: 'relative',
      background: isDark
        ? 'linear-gradient(175deg, #03030C 0%, #06061A 30%, #09091F 62%, #040410 100%)'
        : 'linear-gradient(148deg, #1A5CA8 0%, #3880C8 12%, #68AEDF 26%, #A8D4F0 42%, #E8F4FF 56%, #FFF8E4 68%, #FFE896 80%, #FFD020 90%, #FFBE00 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>

      <style>{`
        @keyframes authFloat  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-10px)} }
        @keyframes authFloat2 { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-7px)}  }
        @keyframes rayShimmer { 0%,100%{opacity:0.85} 40%{opacity:1} 72%{opacity:0.62} }
        @keyframes starBlink  { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:1;transform:scale(1.45)} }
        @keyframes moonPulse  { 0%,100%{opacity:0.55} 50%{opacity:0.9} }
        @keyframes sunHalo    { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
      `}</style>

      {/* ═══════════════ LIGHT: SUN ═══════════════ */}
      {!isDark && <>

        {/* Sky depth — blue absorption at top-left */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(158deg, rgba(8,42,135,0.24) 0%, rgba(18,70,160,0.1) 28%, transparent 52%)', pointerEvents:'none', zIndex:0 }} />

        {/* Mega corona — huge & diffuse */}
        <div style={{ position:'absolute', top:'-45%', right:'-28%', width:720, height:720, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,210,20,0.14) 0%, rgba(255,175,5,0.05) 42%, transparent 65%)', filter:'blur(55px)', pointerEvents:'none', zIndex:0 }} />

        {/* Atmospheric haze ring */}
        <div style={{ position:'absolute', top:'-26%', right:'-13%', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,228,50,0.48) 0%, rgba(255,205,22,0.22) 28%, rgba(255,170,0,0.07) 55%, transparent 72%)', filter:'blur(20px)', animation:'sunHalo 5s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />

        {/* Inner corona */}
        <div style={{ position:'absolute', top:'-17%', right:'-5%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,238,65,0.78) 0%, rgba(255,218,30,0.46) 22%, rgba(255,190,8,0.14) 52%, transparent 68%)', filter:'blur(10px)', pointerEvents:'none', zIndex:1 }} />

        {/* Sun disc */}
        <div style={{ position:'absolute', top:'-11%', right:'1%', width:138, height:138, borderRadius:'50%', background:'radial-gradient(circle at 43% 41%, #FFFEF2 0%, #FFFBBA 15%, #FFE918 38%, #FFD000 62%, #FFBA00 84%)', boxShadow:'0 0 90px rgba(255,218,20,0.95), 0 0 180px rgba(255,190,5,0.42), 0 0 300px rgba(255,165,0,0.14)', pointerEvents:'none', zIndex:2 }} />

        {/* SUN RAYS — individual divs radiating from sun position */}
        {/* Container sits at the sun disc center */}
        <div style={{ position:'absolute', top:'-4%', right:'7%', width:0, height:0, zIndex:0, pointerEvents:'none' }}>
          {SUN_RAYS.map((ray, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: 0, left: -(ray.w / 2),
              width: ray.w,
              height: '200vh',
              background: `linear-gradient(to bottom,
                rgba(255,218,40,${ray.op}) 0%,
                rgba(255,200,25,${ray.op * 0.55}) 22%,
                rgba(255,175,8,${ray.op * 0.22}) 50%,
                transparent 72%)`,
              filter: `blur(${ray.bl}px)`,
              transformOrigin: 'top center',
              transform: `rotate(${ray.a}deg)`,
              animation: `rayShimmer ${ray.dur}s ease-in-out infinite ${ray.dl}s`,
            }} />
          ))}
        </div>

        {/* Warm horizon bloom */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'44%', background:'linear-gradient(to top, rgba(255,155,8,0.30) 0%, rgba(255,185,35,0.12) 48%, transparent 100%)', pointerEvents:'none', zIndex:0 }} />

        {/* Thin horizon line glow */}
        <div style={{ position:'absolute', bottom:'26%', left:0, right:0, height:'2px', background:'linear-gradient(90deg, transparent 0%, rgba(255,195,40,0.45) 35%, rgba(255,175,20,0.55) 55%, transparent 100%)', pointerEvents:'none', zIndex:0 }} />

        {/* Atmospheric scatter — diffuse left side brightening */}
        <div style={{ position:'absolute', top:'15%', left:0, width:'55%', height:'60%', background:'radial-gradient(ellipse at 0% 50%, rgba(255,230,100,0.07) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      </>}

      {/* ═══════════════ DARK: MOON ═══════════════ */}
      {isDark && <>

        {/* Stars */}
        {STARS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', top: s.t, left: s.l,
            width: s.s, height: s.s, borderRadius: '50%',
            background: '#ffffff',
            boxShadow: `0 0 ${s.s * 2.8}px rgba(210,225,255,0.92)`,
            animation: `starBlink ${s.d}s ease-in-out infinite ${s.dl}s`,
            pointerEvents: 'none', zIndex: 0,
          }} />
        ))}

        {/* Milky Way — extremely subtle diagonal band */}
        <div style={{ position:'absolute', top:'-5%', left:'-5%', right:'-5%', height:'45%', background:'radial-gradient(ellipse 55% 75% at 50% 50%, rgba(120,110,195,0.045) 0%, transparent 70%)', transform:'rotate(-18deg)', transformOrigin:'center', pointerEvents:'none', zIndex:0 }} />

        {/* Moon mega outer glow */}
        <div style={{ position:'absolute', top:'-20%', right:'4%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(175,205,255,0.18) 0%, rgba(145,178,255,0.07) 42%, transparent 68%)', filter:'blur(35px)', animation:'moonPulse 9s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />

        {/* Moon mid corona */}
        <div style={{ position:'absolute', top:'-13%', right:'9%', width:225, height:225, borderRadius:'50%', background:'radial-gradient(circle, rgba(190,215,255,0.15) 0%, rgba(160,190,255,0.05) 50%, transparent 72%)', filter:'blur(12px)', animation:'moonPulse 9s ease-in-out infinite 1s', pointerEvents:'none', zIndex:1 }} />

        {/* Moon atmospheric ring */}
        <div style={{ position:'absolute', top:'-10%', right:'11%', width:170, height:170, borderRadius:'50%', border:'0.5px solid rgba(180,205,255,0.12)', background:'transparent', filter:'blur(2px)', animation:'moonPulse 9s ease-in-out infinite', pointerEvents:'none', zIndex:1 }} />

        {/* Moon disc with realistic shading */}
        <div style={{ position:'absolute', top:'-8%', right:'13%', width:118, height:118, borderRadius:'50%', overflow:'hidden', boxShadow:'0 0 65px rgba(150,185,255,0.58), 0 0 130px rgba(125,160,255,0.18)', animation:'moonPulse 9s ease-in-out infinite', pointerEvents:'none', zIndex:2 }}>
          {/* Base surface */}
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 33% 30%, #F5F9FF 0%, #DBEAFF 28%, #B8CCEE 55%, #96AADC 76%, #7A8EC8 92%)' }} />
          {/* Main terminator shadow */}
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 78% 72%, rgba(18,25,65,0.52) 0%, rgba(18,25,65,0.22) 38%, transparent 62%)' }} />
          {/* Subtle surface variations */}
          <div style={{ position:'absolute', top:'18%', left:'48%', width:24, height:22, borderRadius:'50%', background:'rgba(85,105,168,0.30)', boxShadow:'inset 2px 2px 5px rgba(0,0,30,0.25)' }} />
          <div style={{ position:'absolute', top:'50%', left:'20%', width:14, height:13, borderRadius:'50%', background:'rgba(85,105,168,0.24)', boxShadow:'inset 1px 1px 3px rgba(0,0,30,0.18)' }} />
          <div style={{ position:'absolute', top:'33%', left:'34%', width:9,  height:8,  borderRadius:'50%', background:'rgba(85,105,168,0.18)' }} />
          <div style={{ position:'absolute', top:'64%', left:'55%', width:7,  height:7,  borderRadius:'50%', background:'rgba(85,105,168,0.16)' }} />
          <div style={{ position:'absolute', top:'25%', left:'65%', width:5,  height:5,  borderRadius:'50%', background:'rgba(85,105,168,0.14)' }} />
          {/* Rim highlight from light source */}
          <div style={{ position:'absolute', top:'-4%', left:'-4%', width:'55%', height:'55%', borderRadius:'50%', background:'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.18) 0%, transparent 70%)' }} />
        </div>

        {/* MOON RAYS — from moon center */}
        <div style={{ position:'absolute', top:'-2%', right:'21%', width:0, height:0, zIndex:0, pointerEvents:'none' }}>
          {MOON_RAYS.map((ray, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: 0, left: -(ray.w / 2),
              width: ray.w,
              height: '170vh',
              background: `linear-gradient(to bottom,
                rgba(155,182,255,${ray.op}) 0%,
                rgba(140,168,255,${ray.op * 0.52}) 32%,
                rgba(125,150,255,${ray.op * 0.20}) 58%,
                transparent 75%)`,
              filter: `blur(${ray.bl}px)`,
              transformOrigin: 'top center',
              transform: `rotate(${ray.a}deg)`,
            }} />
          ))}
        </div>

        {/* Deep space hints */}
        <div style={{ position:'absolute', top:'22%', left:'6%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(65,50,155,0.08) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', bottom:'15%', right:'4%', width:210, height:210, borderRadius:'50%', background:'radial-gradient(circle, rgba(18,95,75,0.06) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      </>}

      {/* ═══════════════ LOGO ═══════════════ */}
      <div style={{ position:'absolute', top:32, left:36, zIndex:6 }}>
        <Link to="/" style={{ textDecoration:'none' }}>
          <span style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:22, letterSpacing:'-0.5px', color: isDark ? '#fff' : '#091426' }}>
            work<span style={{ color: isDark ? '#7F77DD' : '#2448CC' }}>flow</span>
          </span>
        </Link>
      </div>

      {/* ═══════════════ GLOBE ═══════════════ */}
      <div style={{ position:'relative', zIndex:3 }}>
        <div style={{ position:'absolute', inset:-24, borderRadius:'50%', background: isDark ? 'radial-gradient(circle, rgba(127,119,221,0.10) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(80,140,220,0.12) 0%, transparent 65%)', pointerEvents:'none' }} />
        <Globe locations={locations} width={380} height={380} showLegend={false} />
      </div>

      {/* ═══════════════ BADGES ═══════════════ */}
      <Badge isDark={isDark} style={{ top:'17%', right:'7%' }} animStyle="authFloat 3.5s ease-in-out infinite"
        iconBg="#5DCAA5" icon={<i className="ti ti-shield-check" style={{ fontSize:17, color:'#5DCAA5' }} />}
        value="99%" label="эскроу защита" />

      <Badge isDark={isDark} style={{ top:'27%', left:'4%' }} animStyle="authFloat2 4s ease-in-out infinite 0.8s"
        iconBg="#7F77DD" icon={<span style={{ width:9, height:9, borderRadius:'50%', background:'#1D9E75', display:'inline-block', boxShadow:'0 0 8px #1D9E75' }} />}
        value={onlineCount !== null ? String(onlineCount) : '…'} label="онлайн сейчас" />

      <Badge isDark={isDark} style={{ bottom:'27%', left:'5%' }} animStyle="authFloat 3.8s ease-in-out infinite 1.2s"
        iconBg="#7F77DD" icon={<i className="ti ti-users" style={{ fontSize:17, color:'#7F77DD' }} />}
        value={freelancers !== null ? `${freelancers}+` : '…'} label="фрилансеров" />

      <Badge isDark={isDark} style={{ bottom:'20%', right:'5%' }} animStyle="authFloat2 4.2s ease-in-out infinite 0.4s"
        iconBg="#EF9F27" icon={<i className="ti ti-circle-check" style={{ fontSize:17, color:'#EF9F27' }} />}
        value={completed !== null ? `${completed}+` : '…'} label="завершено проектов" />
    </div>
  )
}
