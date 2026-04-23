import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './styles.css'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart, RadialBar, RadialBarChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { MdWaterDrop, MdOutlineTableChart, MdTrendingDown, MdWarningAmber, MdSatelliteAlt, MdLayers, MdRefresh, MdOutlineImageSearch, MdOutlineMap, MdDataset, MdCheckCircle, MdErrorOutline } from 'react-icons/md'
import { FiActivity, FiAlertTriangle, FiBarChart2, FiDroplet, FiEye, FiGrid, FiInfo, FiSearch, FiStar, FiTrendingUp, FiZap, FiX } from 'react-icons/fi'
import { BiTestTube, BiTargetLock, BiWater, BiStats, BiAbacus } from 'react-icons/bi'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/', timeout: 10000 })

const SL = {
  qualityFlags: 'powai_vihar_analysis__key_findings_flags',
  monthlyObs: 'powai_vihar_analysis__powai_monthly_observations_clean',
  summaryStats:'powai_vihar_analysis__summary_stats_comparison',
  yearlyHydro: 'analysis__analysis_HydroLAKES_polys_v10_mumbai__analysis_yearly',
  yearlyPerm: 'analysis__analysis_permWater_clean_mumbai_poly_shp__analysis_yearly',
  yearlyIND: 'analysis__analysis_IND_water_areas_dcw_mumbai__analysis_yearly',
  gainHydro: 'analysis__analysis_HydroLAKES_polys_v10_mumbai__analysis_gain_vs_loss',
  gainPerm: 'analysis__analysis_permWater_clean_mumbai_poly_shp__analysis_gain_vs_loss',
  gainIND: 'analysis__analysis_IND_water_areas_dcw_mumbai__analysis_gain_vs_loss',
  summaryHydro:'analysis__analysis_HydroLAKES_polys_v10_mumbai__analysis_summary',
  summaryPerm: 'analysis__analysis_permWater_clean_mumbai_poly_shp__analysis_summary',
}

const C = {
  blue:'#0078D4',blueDark:'#005A9E',blueMid:'#2B88D8',blueLight:'#C7E0F4',
  green:'#107C10',greenMid:'#00B050',greenLight:'#DFF6DD',
  orange:'#D83B01',orangeLight:'#FCE4D6',
  yellow:'#FFB900',yellowLight:'#FFF4CE',
  teal:'#00B294',purple:'#7B3FAF',red:'#E74C3C',pink:'#C239B3',
  border:'#EDEBE9',muted:'#605E5C',subtle:'#A19F9D',bg:'#F3F2F1',
}
const PAL = [C.blue,C.green,C.orange,C.teal,C.purple,C.yellow,C.pink,C.blueMid,C.red,'#0099BC']

function LiveClock(){
  const [t,setT]=useState(new Date())
  useEffect(()=>{const id=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(id)},[])
  return <span style={{fontFamily:'monospace',fontSize:12,color:C.muted}}>{t.toLocaleTimeString('en-IN')}</span>
}

function CT({active,payload,label}){
  if(!active||!payload?.length)return null
  return(
    <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 12px',boxShadow:'0 4px 16px rgba(0,0,0,0.12)',fontSize:11,fontFamily:'Inter'}}>
      {label&&<div style={{color:C.muted,fontWeight:600,marginBottom:4}}>{label}</div>}
      {payload.map((p,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'2px 0'}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:p.color||p.fill,flexShrink:0}}/>
          <span style={{fontWeight:700,color:'#201F1E'}}>{typeof p.value==='number'?p.value.toLocaleString(undefined,{maximumFractionDigits:3}):p.value}</span>
          <span style={{color:C.subtle}}>{p.name}</span>
        </div>
      ))}
    </div>
  )
}

function Card({children,style={}}){return <div style={{background:'#fff',borderRadius:10,border:`1px solid ${C.border}`,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,0.07)',...style}}>{children}</div>}
function SH({title,badge,sub}){return(
  <div style={{marginBottom:10}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <h2 style={{fontSize:14,fontWeight:700,color:'#201F1E',margin:0}}>{title}</h2>
      {badge&&<span style={{background:C.blueLight,color:C.blue,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99}}>{badge}</span>}
    </div>
    {sub&&<p style={{margin:'3px 0 0',fontSize:11,color:C.subtle}}>{sub}</p>}
  </div>
)}

function Empty({msg='No data'}){return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,color:C.subtle,fontSize:12}}>{msg}</div>}
function InsightBox({icon,title,body,accent}){return(
  <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 14px',display:'flex',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
    <span style={{color:accent,fontSize:20,flexShrink:0,display:'flex',alignItems:'flex-start',paddingTop:1}}>{icon}</span>
    <div><div style={{fontSize:12,fontWeight:700,color:'#201F1E',marginBottom:2}}>{title}</div><div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{body}</div></div>
  </div>
)}

function KpiCard({title,value,subtitle,accent,icon}){return(
  <div style={{background:'#fff',borderRadius:10,border:`1px solid ${C.border}`,padding:'14px 16px',boxShadow:'0 2px 6px rgba(0,0,0,0.03)',display:'flex',flexDirection:'column',gap:4}}>
    <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10,fontWeight:700,color:C.subtle,textTransform:'uppercase',letterSpacing:'0.08em'}}>{title}</span><span style={{color:accent,fontSize:20,display:'flex',alignItems:'center',opacity:0.8}}>{icon}</span></div>
    <div style={{fontSize:28,fontWeight:850,color:'#111',lineHeight:1,marginTop:6,letterSpacing:'-0.02em'}}>{value??<span className="shimmer" style={{display:'inline-block',width:64,height:28}}/>}</div>
    <div style={{fontSize:10,color:C.subtle,marginTop:2}}>{subtitle}</div>
  </div>
)}

function ConcernBadge({v}){return v?<span style={{background:'#FCE4D6',color:'#D83B01',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,display:'inline-flex',alignItems:'center',gap:4}}><MdWarningAmber size={12}/> Concern</span>:<span style={{background:'#DFF6DD',color:'#107C10',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,display:'inline-flex',alignItems:'center',gap:4}}><MdCheckCircle size={12}/> OK</span>}

export default function App(){
  const [overview, setOverview] = useState(null)
  const [csvFiles, setCsvFiles] = useState([])
  const [images, setImages] = useState([])
  const [shapefiles, setShapefiles] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(false)
  const [syncTime, setSyncTime] = useState('')
  const [error, setError] = useState('')
  const [selectedSlug, setSelectedSlug] = useState('')
  const [selectedInsights, setSelectedInsights] = useState(null)
  const [selectedPreview, setSelectedPreview] = useState([])
  const [explorerTab, setExplorerTab] = useState('trend')
  const [qualityData, setQualityData] = useState([])
  const [yearlyRows, setYearlyRows] = useState({hydro:[],perm:[],ind:[]})
  const [gainRows, setGainRows] = useState([])
  const [summaryRows, setSummaryRows] = useState([])
  const [monthlyRows, setMonthlyRows] = useState([])
  const [showAllGallery, setShowAllGallery] = useState(true)
  const [activeImage, setActiveImage] = useState(null)
  const [mlData, setMlData] = useState(null)
  const [satData, setSatData] = useState(null)

  const loadPanels = async () => {
    const safe = async (url) => { try { const r=await api.get(url,{params:{limit:100}}); return r.data.preview||[] } catch{ return [] } }
    const [qd,hy,pe,id,gh,gp,gi,mn,sm] = await Promise.all([
      safe(`/api/csv/${SL.qualityFlags}/preview`),
      safe(`/api/csv/${SL.yearlyHydro}/preview`),
      safe(`/api/csv/${SL.yearlyPerm}/preview`),
      safe(`/api/csv/${SL.yearlyIND}/preview`),
      safe(`/api/csv/${SL.gainHydro}/preview`),
      safe(`/api/csv/${SL.gainPerm}/preview`),
      safe(`/api/csv/${SL.gainIND}/preview`),
      safe(`/api/csv/${SL.monthlyObs}/preview`),
      safe(`/api/csv/${SL.summaryStats}/preview`),
    ])
    setQualityData(qd)
    setYearlyRows({hydro:hy,perm:pe,ind:id})
    const mkGain=(rows,label)=>rows.map(r=>({
      dataset:label, gain:parseFloat(r.gain_ha)||0, loss:parseFloat(r.loss_ha)||0,
      netChange: (parseFloat(r.gain_ha)||0)-(parseFloat(r.loss_ha)||0)
    }))
    setGainRows([
      ...mkGain(gh,'HydroLAKES'),
      ...mkGain(gp,'PermWater Poly'),
      ...mkGain(gi,'IND Water Areas'),
    ])
    setMonthlyRows(mn)
    setSummaryRows(sm)

    try {
      const [ml, sat] = await Promise.all([
        api.get('/api/ml/forecast'),
        api.get('/api/ml/satellite')
      ])
      setMlData(ml.data)
      setSatData(sat.data)
    } catch (e) {
      console.error("ML/Sat fetch error", e)
    }
  }

  const loadBase = async () => {
    const res = await Promise.allSettled([
      api.get('/api/overview'), api.get('/api/csv-files'),
      api.get('/api/images'), api.get('/api/shapefiles'), api.get('/api/predictions')
    ])
    const [ov,csv,img,shp,pred] = res
    if(ov.status==='fulfilled')  setOverview(ov.value.data)
    if(csv.status==='fulfilled'){
      const items=csv.value.data.items||[]
      setCsvFiles(items)
      if(items.length>0&&!selectedSlug) setSelectedSlug(items[0].slug)
    }
    if(img.status==='fulfilled')  setImages(img.value.data.items||[])
    if(shp.status==='fulfilled')  setShapefiles(shp.value.data.items||[])
    if(pred.status==='fulfilled') setPredictions(pred.value.data.items||[])
    setSyncTime(new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}))
  }

  const loadSelected = async(slug)=>{
    if(!slug)return
    try{
      const [a,b]=await Promise.all([
        api.get(`/api/csv/${slug}/insights`),
        api.get(`/api/csv/${slug}/preview`,{params:{limit:25}})
      ])
      setSelectedInsights(a.data)
      setSelectedPreview(b.data.preview||[])
    }catch{}
  }

  const refresh = async()=>{
    setLoading(true);setError('')
    try{try{await api.post('/api/refresh')}catch{};await loadBase();await loadPanels();if(selectedSlug)await loadSelected(selectedSlug)}
    catch(e){setError(e?.message||'Error')}
    finally{setLoading(false)}
  }

  useEffect(()=>{
    (async()=>{setLoading(true);try{await Promise.all([loadBase(),loadPanels()])}catch(e){setError(e?.message||'Error')}finally{setLoading(false)}})()
  },[])
  useEffect(()=>{loadSelected(selectedSlug)},[selectedSlug])
  useEffect(()=>{const id=setInterval(()=>refresh(),60000);return()=>clearInterval(id)},[selectedSlug])

  const generatePDFReport = () => {
    const doc = new jsPDF()
    const now = new Date().toLocaleString('en-IN')
    doc.setFontSize(22)
    doc.setTextColor(0, 120, 212)
    doc.text('Mumbai Water Intelligence Report', 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated on: ${now}`, 14, 28)
    doc.text('Confidential Analysis · Powai & Vihar Lake Systems', 14, 33)
    doc.setDrawColor(0, 120, 212)
    doc.setLineWidth(0.5)
    doc.line(14, 38, 196, 38)
    doc.setFontSize(14)
    doc.setTextColor(32)
    doc.text('1. Executive Summary', 14, 48)
    doc.setFontSize(10)
    doc.setTextColor(60)
    const summary = [
      "This report provides a comprehensive environmental forecast for the year 2026 based on hybrid intelligence merging",
      "historical laboratory data (2015-2017) and satellite-derived observations from the Sentinel-2 mission.",
      `Current analysis covers ${overview?.csv_count} datasets and ${overview?.total_csv_rows.toLocaleString()} individual observations.`,
      "Key findings indicate significant environmental stress on Powai Lake due to urbanization and organic load."
    ]
    doc.text(summary, 14, 55)
    doc.setFontSize(14)
    doc.setTextColor(32)
    doc.text('2. 2026 Water Quality Index (WQI) Forecast', 14, 85)
    const wqiRows = wqi2026.map(w => [w.location, w.wqi_score.toString(), w.rating])
    autoTable(doc, {
      startY: 92,
      head: [['Location', 'WQI Score (Predicted 2026)', 'Health Rating']],
      body: wqiRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 120, 212] }
    })
    doc.setFontSize(14)
    doc.setTextColor(32)
    doc.text('3. Hazardous Pollutant Predictions vs WHO Limits', 14, doc.lastAutoTable.finalY + 15)
    const pollRows = hazardousList.map(h => [h.location, h.parameter, h.predicted_value.toString(), h.who_limit.toString(), h.status])
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 22,
      head: [['Lake', 'Parameter', '2026 Prediction (mg/L)', 'WHO Limit', 'Safety Status']],
      body: pollRows,
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60] }
    })
    doc.setFontSize(14)
    doc.setTextColor(32)
    doc.text('4. Satellite-Derived Environmental Indices', 14, doc.lastAutoTable.finalY + 15)
    const satRows = satelliteSummary.slice(-5).map(s => [s.year, s.water_area_ha.toFixed(2), s.turbidity + '%', s.chlorophyll + '%'])
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 22,
      head: [['Year', 'Water Area (ha)', 'Turbidity Index', 'Chlorophyll-a Index']],
      body: satRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 124, 16] }
    })

    const pageCount = doc.internal.getNumberOfPages()
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(9)
      doc.setTextColor(150)
      doc.text(`Page ${i} of ${pageCount} · Mumbai Water Intelligence`, 14, 285)
    }

    doc.save(`Mumbai_Water_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const trendSeries = useMemo(()=>{
    if(!selectedInsights?.trend)return[]
    const base=selectedInsights.trend.series.map(d=>({x:d.x,actual:d.y,forecast:null}))
    const future=selectedInsights.trend.forecast.map(d=>({x:d.x,actual:null,forecast:d.y}))
    return[...base,...future]
  },[selectedInsights])

  const numericSummary = useMemo(()=>(selectedInsights?.numeric_summary||[]).slice(0,12),[selectedInsights])

  const csvForBar = useMemo(()=>
    csvFiles.filter(x=>typeof x.row_count==='number').sort((a,b)=>b.row_count-a.row_count).slice(0,10)
      .map(x=>({name:x.name.length>20?`${x.name.slice(0,20)}…`:x.name,rows:x.row_count}))
  ,[csvFiles])

  const shapeArea = useMemo(()=>
    shapefiles.map(s=>({name:s.name.length>16?`${s.name.slice(0,16)}…`:s.name,features:s.feature_count||0}))
  ,[shapefiles])

  const donutData = useMemo(()=>{
    const types={}
    csvFiles.forEach(f=>{
      const t=f.name.includes('gain')?'Gain/Loss':f.name.includes('summary')?'Summary':f.name.includes('yearly')?'Yearly':f.name.includes('quality')||f.name.includes('observ')?'Quality/Monthly':f.name.includes('3Lakes')||f.name.includes('Mumbai')?'NDWI/Lakes':'Other'
      types[t]=(types[t]||0)+1
    })
    return Object.entries(types).map(([n,v])=>({name:n,value:v}))
  },[csvFiles])

  const qualityBarData = useMemo(()=>
    qualityData.filter(r=>r.powai_mean!=null&&r.vihar_mean!=null&&r.unit!=='no unit'&&r.unit!=='index')
      .slice(0,8)
      .map(r=>({
        param: r.parameter.length>22?r.parameter.slice(0,22)+'…':r.parameter,
        unit: r.unit, powai: +parseFloat(r.powai_mean).toFixed(3),
        vihar: +parseFloat(r.vihar_mean).toFixed(3),
        concern: r.powai_more_concerning
      }))
  ,[qualityData])

  const yearlyTimeline = useMemo(()=>{
    const byYear={}
    yearlyRows.hydro.forEach(r=>{if(r.year){byYear[r.year]=byYear[r.year]||{};byYear[r.year].hydro=(byYear[r.year].hydro||0)+parseFloat(r.water_area_ha||0)}})
    yearlyRows.perm.forEach(r=>{if(r.year){byYear[r.year]=byYear[r.year]||{};byYear[r.year].perm=(byYear[r.year].perm||0)+parseFloat(r.water_area_ha||0)}})
    yearlyRows.ind.forEach(r=>{if(r.year){byYear[r.year]=byYear[r.year]||{};byYear[r.year].ind=(byYear[r.year].ind||0)+parseFloat(r.water_area_ha||0)}})
    return Object.entries(byYear).sort((a,b)=>+a[0]-+b[0])
      .map(([year,v])=>({year,HydroLAKES:+(v.hydro||0).toFixed(2),PermWater:+(v.perm||0).toFixed(2),'IND Water':+(v.ind||0).toFixed(2)}))
  },[yearlyRows])

  const gainSummary = useMemo(()=>{
    if(!gainRows.length)return[]
    const map={}
    gainRows.forEach(r=>{
      if(!map[r.dataset])map[r.dataset]={dataset:r.dataset,gain:0,loss:0}
      map[r.dataset].gain+= r.gain
      map[r.dataset].loss+= r.loss
    })
    return Object.values(map).map(r=>({...r,gain:+r.gain.toFixed(2),loss:+(r.loss*-1).toFixed(2),net:+(r.gain-r.loss).toFixed(2)}))
  },[gainRows])

  const monthlyDO = useMemo(()=>{
    const rows=monthlyRows.filter(r=>r.parameter==='Transparency'&&r.month)
    const byMonth={}
    rows.forEach(r=>{
      const key=r.plot_label||r.month
      if(!byMonth[key])byMonth[key]={month:key,month_num:+r.month_num||12,powai:null}
      if(r.powai_mean!=null)byMonth[key].powai=+parseFloat(r.powai_mean).toFixed(1)
    })
    return Object.values(byMonth).sort((a,b)=>a.month_num-b.month_num)
  },[monthlyRows])

  const predBar = useMemo(()=>
    predictions.slice(0,8).map(p=>({name:p.name.length>18?`${p.name.slice(0,18)}…`:p.name,next:p.forecast[0]?.y??0}))
  ,[predictions])

  const powaiArea1973=1.264556, powaiArea2014=0.963217
  const powaiShrinkPct = (((powaiArea1973-powaiArea2014)/powaiArea1973)*100).toFixed(1)

  const hazardousList = useMemo(() => {
    if (!mlData?.training_report?.hazardous_pollutants) return []
    return mlData.training_report.hazardous_pollutants
  }, [mlData])

  const satelliteSummary = useMemo(() => {
    if (!satData?.summary) return []
    return satData.summary.map(s => ({
      ...s,
      year: s.year.toString(),
      turbidity: +(s.turbidity_index * 100).toFixed(1),
      chlorophyll: +(s.chlorophyll_index * 100).toFixed(1)
    }))
  }, [satData])

  const wqi2026 = useMemo(() => {
    if (!mlData?.wqi_2026) return []
    return mlData.wqi_2026
  }, [mlData])

  return(
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'Inter, sans-serif'}}>
      <header style={{background:'#fff',borderBottom:`1px solid ${C.border}`,boxShadow:'0 1px 10px rgba(0,0,0,0.05)',padding:'0 24px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:38,height:38,borderRadius:10,background:`#fff`,border:`1.5px solid ${C.blue}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`inset 0 0 8px ${C.blue}15`}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:900,color:'#111',lineHeight:1.1,letterSpacing:'-0.01em'}}>Mumbai Water Intelligence</div>
            <div style={{fontSize:10,color:C.subtle,marginTop:2,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Research Analytics · Powai & Vihar Lake Systems</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><span className="live-dot"/><span style={{fontSize:11,color:C.green,fontWeight:700}}>LIVE</span></div>
          <LiveClock/>
          {syncTime&&<span style={{fontSize:11,color:C.subtle}}>Synced {syncTime}</span>}
          {error&&<span style={{background:C.orangeLight,color:C.orange,fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:5,display:'flex',alignItems:'center',gap:4}}><MdErrorOutline/> {error.slice(0,40)}</span>}
          <button id="btn-report" onClick={generatePDFReport}
            style={{background:'#fff',color:C.blue,border:`1px solid ${C.blue}`,borderRadius:7,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
            <MdOutlineTableChart size={16}/> Report
          </button>
          <button id="btn-refresh" onClick={refresh} disabled={loading}
            style={{background:C.blue,color:'#fff',border:'none',borderRadius:7,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,opacity:loading?0.7:1}}>
            <svg style={{width:13,height:13,animation:loading?'spin 0.8s linear infinite':undefined}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            {loading?'Syncing…':'Refresh'}
          </button>
        </div>
      </header>

      <div style={{maxWidth:1600,margin:'0 auto',padding:'20px 24px',display:'grid',gap:20}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          <KpiCard title="CSV Datasets" value={overview?.csv_count??null}                      subtitle="Live scanned files"          accent={C.blue}   icon={<FiBarChart2/>}/>
          <KpiCard title="Plot Images" value={overview?.image_count??null}                    subtitle="Satellite visualisations"    accent={C.green}  icon={<MdSatelliteAlt/>}/>
          <KpiCard title="Shapefiles" value={overview?.shapefile_count??null}                subtitle="Water polygon layers"        accent={C.orange} icon={<MdOutlineMap/>}/>
          <KpiCard title="Total Rows" value={overview?.total_csv_rows?.toLocaleString()??null} subtitle="Observations across CSVs"  accent={C.yellow} icon={<BiAbacus/>}/>
        </div>

        <Card style={{padding:'16px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <MdWaterDrop style={{fontSize:18,color:C.blue}}/>
            <h2 style={{margin:0,fontSize:14,fontWeight:700,color:'#201F1E'}}>Mumbai Water Intelligence — What the Data Reveals</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            <InsightBox icon={<MdTrendingDown/>} accent={C.orange} title={`Powai Lake Shrank ${powaiShrinkPct}%`} body="Satellite data confirms Powai Lake shrank from 1.26 km² (1973) to 0.96 km² (2014) — a 23.8% loss of surface area over 41 years."/>
            <InsightBox icon={<BiTestTube/>} accent={C.red}    title="Powai More Polluted" body="Powai Lake has higher BOD, ammonia, nitrate and phosphorus than Vihar Lake — indicating more organic pollution and eutrophication pressure."/>
            <InsightBox icon={<BiWater/>} accent={C.blue}   title="Water Area 2022→2026" body="MNDWI satellite analysis tracks permanent water coverage annually across Mumbai's lakes, rivers and reservoirs using Sentinel-2 imagery."/>
            <InsightBox icon={<FiActivity/>} accent={C.teal}   title="ML Trend Forecasting" body="Linear regression models trained on per-lake yearly area data predict near-future water coverage, flagging lakes at risk of continued decline."/>
          </div>
        </Card>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {wqi2026.map(w => (
            <Card key={w.location} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px'}}>
              <div>
                <div style={{fontSize:10, fontWeight:700, color:C.subtle, textTransform:'uppercase', letterSpacing:'0.05em'}}>WQI Forecast 2026</div>
                <div style={{fontSize:22, fontWeight:900, color:'#111', marginTop:4}}>{w.location} Lake: {w.wqi_score}</div>
                <div style={{fontSize:12, color: w.wqi_score > 50 ? C.orange : C.green, fontWeight:700, marginTop:2}}>Condition: {w.rating}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{width:54, height:54, borderRadius:'50%', border:`3px solid ${w.wqi_score > 50 ? C.orangeLight : C.greenLight}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color: w.wqi_score > 50 ? C.orange : C.green}}>
                  {Math.round(w.wqi_score)}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 320px',gap:14}}>
          <Card>
            <SH title="Dataset Volume by File" badge={`${csvForBar.length} files`} sub="Row count per CSV dataset"/>
            {csvForBar.length===0?<Empty/>:(
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={csvForBar} margin={{top:4,right:8,left:-10,bottom:50}}>
                  <defs>{csvForBar.map((_,i)=><linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PAL[i%PAL.length]} stopOpacity={0.9}/><stop offset="100%" stopColor={PAL[i%PAL.length]} stopOpacity={0.45}/></linearGradient>)}</defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:9,fill:C.subtle}} angle={-35} textAnchor="end" height={58} interval={0}/>
                  <YAxis tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT/>}/>
                  <Bar dataKey="rows" name="Rows" radius={[4,4,0,0]} maxBarSize={32}>{csvForBar.map((_,i)=><Cell key={i} fill={`url(#bg${i})`}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card>
            <SH title="Shapefile Feature Counts" badge={`${shapeArea.length} layers`} sub="Water polygon feature count per spatial layer"/>
            {shapeArea.length===0?<Empty/>:(
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={shapeArea} margin={{top:4,right:8,left:-10,bottom:8}}>
                  <defs><linearGradient id="shpG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={0.25}/><stop offset="95%" stopColor={C.teal} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT/>}/>
                  <Area type="monotone" dataKey="features" name="Features" stroke={C.teal} strokeWidth={2.5} fill="url(#shpG)" dot={{r:4,fill:C.teal,strokeWidth:0}} activeDot={{r:6}}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card>
            <SH title="Dataset Categories" sub="CSV type distribution by naming pattern"/>
            {donutData.length===0?<Empty/>:(
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <defs>{donutData.map((_,i)=><linearGradient key={i} id={`dg${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={PAL[i%PAL.length]} stopOpacity={0.9}/><stop offset="100%" stopColor={PAL[i%PAL.length]} stopOpacity={0.6}/></linearGradient>)}</defs>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value" nameKey="name">
                      {donutData.map((_,i)=><Cell key={i} fill={`url(#dg${i})`} stroke="none"/>)}
                    </Pie>
                    <Tooltip content={<CT/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 8px'}}>
                  {donutData.map((d,i)=>(
                    <div key={d.name} style={{display:'flex',alignItems:'center',gap:5,fontSize:10}}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:PAL[i%PAL.length],flexShrink:0}}/>
                      <span style={{color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</span>
                      <span style={{marginLeft:'auto',fontWeight:700,color:'#201F1E'}}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        <Card>
          <SH title="Annual Water Coverage 2022–2026 (Satellite MNDWI)" badge="Real Data" sub="Total water area in hectares per dataset source — derived from Sentinel-2 satellite MNDWI classification"/>
          {yearlyTimeline.length===0?<Empty msg="Loading yearly satellite data…"/>:(
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={yearlyTimeline} margin={{top:8,right:20,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="hydG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.1}/><stop offset="100%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false}/>
                <XAxis dataKey="year" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false} label={{value:'Water Area (ha)',angle:-90,position:'insideLeft',fontSize:10,fill:C.subtle,offset:10}}/>
                <Tooltip content={<CT/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,paddingTop:8}}/>
                <Line type="monotone" dataKey="HydroLAKES" stroke={C.blue}   strokeWidth={2.5} dot={{r:5,fill:C.blue,strokeWidth:0}}   activeDot={{r:7}}/>
                <Line type="monotone" dataKey="PermWater"  stroke={C.green}  strokeWidth={2.5} dot={{r:5,fill:C.green,strokeWidth:0}}  activeDot={{r:7}}/>
                <Line type="monotone" dataKey="IND Water"  stroke={C.orange} strokeWidth={2.5} dot={{r:5,fill:C.orange,strokeWidth:0}} activeDot={{r:7}} strokeDasharray="6 3"/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <Card>
            <SH title="Water Gain vs Loss by Dataset Source" badge="Real Data" sub="Hectares gained / lost per water polygon dataset (2022→2026)"/>
            {gainSummary.length===0?<Empty msg="Loading gain/loss data…"/>:(
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={gainSummary} margin={{top:4,right:8,left:-5,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false}/>
                  <XAxis dataKey="dataset" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false} label={{value:'ha',angle:-90,position:'insideLeft',fontSize:10,fill:C.subtle}}/>
                  <Tooltip content={<CT/>}/>
                  <ReferenceLine y={0} stroke={C.border} strokeWidth={2}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,paddingTop:6}}/>
                  <Bar dataKey="gain" name="Gain (ha)" fill={C.green}  radius={[4,4,0,0]} maxBarSize={40}/>
                  <Bar dataKey="loss" name="Loss (ha)" fill={C.red}    radius={[4,4,0,0]} maxBarSize={40}/>
                  <Bar dataKey="net"  name="Net (ha)"  fill={C.blue}   radius={[4,4,0,0]} maxBarSize={40}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <SH title="Water Transparency — Powai Lake (Oct 2016 – May 2017)" badge="Real Data" sub="Transparency (cm) = water clarity by month. Higher = cleaner water. Source: 2018 assessment study."/>
            {monthlyDO.length===0?<Empty msg="No monthly observations found"/>:(
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyDO} margin={{top:4,right:16,left:-10,bottom:0}}>
                    <defs>
                      <linearGradient id="doP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.25}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false}/>
                    <XAxis dataKey="month" tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false} label={{value:'cm',angle:-90,position:'insideLeft',fontSize:10,fill:C.subtle}}/>
                    <Tooltip content={<CT/>}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,paddingTop:4}}/>
                    <Area type="monotone" dataKey="powai" name="Transparency (cm)" stroke={C.blue} strokeWidth={2.5} fill="url(#doP)" dot={{r:5,fill:C.blue,strokeWidth:0}} activeDot={{r:7}} connectNulls/>
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{fontSize:10,color:C.blue,marginTop:6,padding:'6px 8px',background:C.blueLight,borderRadius:4,display:'flex',alignItems:'center',gap:6}}>
                  <FiInfo size={14}/> Transparency ranged from 73–95 cm across Oct 2016–May 2017. Lower values in winter months indicate higher suspended particles or algal growth in Powai Lake.
                </div>
              </>
            )}
          </Card>
        </div>

        <Card>
          <SH title="Powai vs Vihar Lake — Water Quality Parameters Comparison" badge="Real Data · 2015 Study" sub="Mean values across 8 key water quality parameters — source: peer-reviewed Mumbai megacity lake study"/>
          {qualityBarData.length===0?<Empty msg="Loading water quality data…"/>:(
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={qualityBarData} margin={{top:4,right:20,left:0,bottom:60}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false}/>
                  <XAxis dataKey="param" tick={{fontSize:9,fill:C.muted}} angle={-30} textAnchor="end" height={65} interval={0}/>
                  <YAxis tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT/>}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,paddingTop:4}}/>
                  <Bar dataKey="powai" name="Powai Lake" fill={C.blue}  radius={[4,4,0,0]} maxBarSize={30}/>
                  <Bar dataKey="vihar" name="Vihar Lake" fill={C.green} radius={[4,4,0,0]} maxBarSize={30}/>
                </BarChart>
              </ResponsiveContainer>
              <div style={{marginTop:12,overflowX:'auto'}}>
                <table className="data-table">
                  <thead><tr><th>Parameter</th><th>Unit</th><th>Powai Mean</th><th>Vihar Mean</th><th>Δ Diff</th><th>% Diff</th><th>Status</th></tr></thead>
                  <tbody>
                    {qualityData.filter(r=>r.powai_mean!=null&&r.vihar_mean!=null&&r.unit!=='no unit'&&r.unit!=='index').slice(0,10).map(r=>(
                      <tr key={r.parameter}>
                        <td style={{fontWeight:600,color:C.blue}}>{r.parameter}</td>
                        <td style={{color:C.subtle}}>{r.unit}</td>
                        <td>{parseFloat(r.powai_mean).toFixed(3)}</td>
                        <td>{parseFloat(r.vihar_mean).toFixed(3)}</td>
                        <td style={{color: r.difference_powai_minus_vihar>0?C.orange:C.green, fontWeight:600}}>
                          {r.difference_powai_minus_vihar>0?'+':''}{parseFloat(r.difference_powai_minus_vihar).toFixed(3)}
                        </td>
                        <td style={{color: r.pct_diff_vs_vihar>20?C.orange:C.muted, fontWeight:600}}>
                          {r.pct_diff_vs_vihar>0?'+':''}{parseFloat(r.pct_diff_vs_vihar).toFixed(1)}%
                        </td>
                        <td><ConcernBadge v={r.powai_more_concerning}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <Card>
            <SH title="2026 Pollutant Forecast vs WHO Limits" badge="ML Prediction" sub="Predicted chemical concentration levels for 2026 using Random Forest Regression"/>
            <div className="inner-scroll" style={{maxHeight:300}}>
              <table className="data-table">
                <thead><tr><th>Location</th><th>Parameter</th><th>2026 Pred</th><th>WHO Limit</th><th>Status</th></tr></thead>
                <tbody>
                  {hazardousList.map((h, i) => (
                    <tr key={i}>
                      <td style={{fontWeight:700}}>{h.location}</td>
                      <td style={{color:C.blue}}>{h.parameter}</td>
                      <td style={{fontWeight:800}}>{h.predicted_value}</td>
                      <td style={{color:C.subtle}}>{h.who_limit}</td>
                      <td>
                        <span style={{
                          background: h.status === 'Safe' ? C.greenLight : h.status === 'Warning' ? C.yellowLight : C.orangeLight,
                          color: h.status === 'Safe' ? C.green : h.status === 'Warning' ? C.yellow : C.orange,
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4
                        }}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <SH title="Satellite Water Quality Indices" badge="MNDWI Analysis" sub="Turbidity and Chlorophyll-a index trends derived from satellite band ratios"/>
            {satelliteSummary.length === 0 ? <Empty/> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={satelliteSummary} margin={{top:10, right:20, left:0, bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false}/>
                  <XAxis dataKey="year" tick={{fontSize:11}}/>
                  <YAxis tick={{fontSize:10}} label={{value:'Index %', angle:-90, position:'insideLeft', fontSize:10}}/>
                  <Tooltip content={<CT/>}/>
                  <Legend iconType="circle" wrapperStyle={{fontSize:11, paddingTop:10}}/>
                  <Line type="monotone" dataKey="turbidity" name="Turbidity Index" stroke={C.orange} strokeWidth={3} dot={{r:4}} activeDot={{r:6}}/>
                  <Line type="monotone" dataKey="chlorophyll" name="Chlorophyll-a" stroke={C.greenMid} strokeWidth={3} dot={{r:4}} activeDot={{r:6}}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <Card style={{padding:0,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'220px 1fr',height:520}}>
            <div style={{borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
              <div style={{padding:'14px 14px 10px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,color:'#201F1E',textTransform:'uppercase',letterSpacing:'0.05em'}}>All Datasets</div>
                <div style={{fontSize:10,color:C.subtle,marginTop:2}}>{csvFiles.length} files indexed</div>
              </div>
              <div className="inner-scroll" style={{flex:1,overflowY:'auto',overflowX:'hidden'}}>
                {csvFiles.map(f=>(
                  <button key={f.slug} id={`file-${f.slug}`} onClick={()=>setSelectedSlug(f.slug)}
                    className={selectedSlug===f.slug?'file-item-active':''}
                    style={{width:'100%',textAlign:'left',padding:'9px 14px',background:'none',border:'none',borderBottom:`1px solid #F3F2F1`,cursor:'pointer',transition:'background 0.1s'}}>
                    <div style={{fontSize:11,fontWeight:600,color:selectedSlug===f.slug?C.blue:'#201F1E',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                    <div style={{fontSize:9,color:C.subtle,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.path?.split('/').slice(1,3).join(' › ')}</div>
                    <div style={{fontSize:10,color:C.subtle,marginTop:1}}>{(f.row_count??0).toLocaleString()} rows · {f.column_count} cols</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',padding:16,gap:10}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:'#201F1E'}}>{selectedInsights?.name||'Select a dataset'}</div>
                  {selectedInsights&&(
                    <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
                      <span style={{background:C.blueLight,color:C.blue,fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:4}}>{selectedInsights.row_count?.toLocaleString()} rows</span>
                      <span style={{background:'#F3F2F1',color:C.muted,fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:4}}>{selectedInsights.column_count} columns</span>
                    </div>
                  )}
                </div>
                <div style={{display:'flex',background:'#F3F2F1',borderRadius:8,padding:3,gap:2}}>
                  {[['trend',<FiTrendingUp/>,'Trend'],['stats',<BiStats/>,'Stats'],['preview',<FiSearch/>,'Raw Data']].map(([tab,icon,lbl])=>(
                    <button key={tab} id={`tab-${tab}`} onClick={()=>setExplorerTab(tab)}
                      style={{fontSize:11,fontWeight:600,padding:'5px 10px',borderRadius:6,border:'none',cursor:'pointer',background:explorerTab===tab?'#fff':'transparent',color:explorerTab===tab?C.blue:C.muted,boxShadow:explorerTab===tab?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all 0.15s',display:'flex',alignItems:'center',gap:6}}>
                      {icon} {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{flex:1,minHeight:0}}>
                {explorerTab==='trend'&&(trendSeries.length>0?(
                  <ResponsiveContainer width="100%" height={340}>
                    <ComposedChart data={trendSeries} margin={{top:8,right:16,left:-5,bottom:0}}>
                      <defs>
                        <linearGradient id="actG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.15}/><stop offset="100%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                        <linearGradient id="fctG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity={0.1}/><stop offset="100%" stopColor={C.orange} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false}/>
                      <XAxis dataKey="x" tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CT/>}/>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,paddingTop:8}}/>
                      <Area type="monotone" dataKey="actual"   name="Actual"   stroke={C.blue}   strokeWidth={2.5} fill="url(#actG)" dot={false} connectNulls={false}/>
                      <Area type="monotone" dataKey="forecast" name="Forecast" stroke={C.orange} strokeWidth={2} strokeDasharray="6 4" fill="url(#fctG)" dot={false} connectNulls={false}/>
                    </ComposedChart>
                  </ResponsiveContainer>
                ):<Empty msg="No trend available — select a dataset with time-series data"/>)}
                {explorerTab==='stats'&&(
                  <div className="inner-scroll" style={{maxHeight:340}}>
                    {numericSummary.length===0?<Empty msg="No numeric columns"/>:(
                      <table className="data-table">
                        <thead><tr><th>Column</th><th>Min</th><th>Max</th><th>Mean</th><th>Median</th><th>Std Dev</th><th>Variability</th></tr></thead>
                        <tbody>{numericSummary.map(r=>(
                          <tr key={r.column}>
                            <td style={{fontWeight:600,color:C.blue}}>{r.column}</td>
                            <td>{r.min.toFixed(4)}</td><td>{r.max.toFixed(4)}</td>
                            <td>{r.mean.toFixed(4)}</td><td>{r.median.toFixed(4)}</td>
                            <td>{r.std.toFixed(4)}</td>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <div style={{width:60,height:5,background:C.bg,borderRadius:99,overflow:'hidden'}}>
                                  <div style={{height:'100%',width:`${Math.min(100,(r.std/(r.max-r.min||1))*200)}%`,background:C.blue,borderRadius:99}}/>
                                </div>
                                <span style={{fontSize:10,color:C.muted}}>{(r.max-r.min).toFixed(3)}</span>
                              </div>
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    )}
                  </div>
                )}
                {explorerTab==='preview'&&(
                  <div className="inner-scroll" style={{maxHeight:340}}>
                    {selectedPreview.length===0?<Empty msg="No preview data"/>:(
                      <table className="data-table">
                        <thead><tr>{Object.keys(selectedPreview[0]).filter(k=>k!=='.geo'&&k!=='system:index').map(k=><th key={k}>{k}</th>)}</tr></thead>
                        <tbody>{selectedPreview.map((row,i)=>(
                          <tr key={i}>{Object.entries(row).filter(([k])=>k!=='.geo'&&k!=='system:index').map(([k,v])=><td key={k}>{`${v??''}`}</td>)}</tr>
                        ))}</tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {predBar.length>0&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Card>
              <SH title="ML Forecast — Next Predicted Values" badge={`${predictions.length} models`} sub="One-step-ahead water area forecast per dataset model"/>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={predBar} layout="vertical" margin={{top:4,right:16,left:8,bottom:0}}>
                  <defs>{predBar.map((_,i)=><linearGradient key={i} id={`pb${i}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={PAL[i%PAL.length]} stopOpacity={0.8}/><stop offset="100%" stopColor={PAL[i%PAL.length]} stopOpacity={0.4}/></linearGradient>)}</defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:10,fill:C.subtle}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:C.muted}} width={140} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT/>}/>
                  <Bar dataKey="next" name="Forecast Value" radius={[0,5,5,0]} maxBarSize={20}>{predBar.map((_,i)=><Cell key={i} fill={`url(#pb${i})`}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SH title="Prediction Detail Feed" badge={`${predictions.length}`} sub="Per-model ML forecast step values"/>
              <div className="inner-scroll" style={{maxHeight:220}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {predictions.slice(0,10).map((p,idx)=>(
                    <div key={p.slug} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',background:'#FAFAFA'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <div style={{fontSize:11,fontWeight:700,color:'#201F1E',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{p.name}</div>
                        <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:99,background:`${PAL[idx%PAL.length]}18`,color:PAL[idx%PAL.length],flexShrink:0,marginLeft:4}}>ML</span>
                      </div>
                      <div style={{fontSize:10,color:C.subtle,marginBottom:6}}>{p.metric_column}</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:2}}>
                        {p.forecast.slice(0,3).map((f,i)=><span key={i} className="forecast-badge">{f.x.toFixed(1)}→{f.y.toFixed(2)}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {images.length>0&&(
          <Card>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <SH title="Satellite Plot Library" badge={`${images.length} images`} sub="MNDWI-derived water visualisation plots — Sentinel-2 imagery"/>
              <button onClick={()=>setShowAllGallery(v=>!v)} style={{background:C.bg,border:`1px solid ${C.border}`,color:C.muted,fontSize:11,fontWeight:600,borderRadius:6,padding:'5px 10px',cursor:'pointer'}}>
                {showAllGallery?'Collapse ▲':'Show All ▼'}
              </button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
              {(showAllGallery?images:images.slice(0,8)).map(img=>(
                <div key={img.path} onClick={()=>setActiveImage(img)}
                  style={{borderRadius:8,overflow:'hidden',border:`1px solid ${C.border}`,background:'#FAF9F8',cursor:'pointer',transition:'all 0.2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 4px 12px rgba(0,120,212,0.18)`;e.currentTarget.style.borderColor=C.blue}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor=C.border}}>
                  <img src={img.url} alt={img.name} loading="lazy" style={{width:'100%',height:140,objectFit:'cover',display:'block'}}/>
                  <div style={{padding:'6px 8px',fontSize:10,color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{img.name}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div style={{textAlign:'center',padding:'12px 0 24px',fontSize:11,color:C.subtle}}>
          Mumbai Water Intelligence Dashboard · Data auto-refreshes every 60s · Satellite MNDWI + Powai/Vihar Lake Research Data
        </div>
      </div>

      {activeImage&&(
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(32,31,30,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(5px)',padding:40}}
            onClick={()=>setActiveImage(null)}>
          <button style={{position:'fixed',top:20,right:24,background:'none',border:'none',color:'#fff',cursor:'pointer',zIndex:1001}}>
            <FiX size={32}/>
          </button>
          <div style={{position:'relative',maxWidth:'95%',maxHeight:'95%',background:'#fff',borderRadius:12,padding:12,boxShadow:'0 20px 60px rgba(0,0,0,0.5)',animation:'scaleIn 0.2s ease-out'}}
               onClick={e=>e.stopPropagation()}>
            <img src={activeImage.url} alt={activeImage.name} style={{maxWidth:'100%',maxHeight:'calc(95vh - 60px)',borderRadius:8,display:'block',objectFit:'contain'}}/>
            <div style={{marginTop:12,padding:'0 4px'}}>
              <div style={{fontSize:14,fontWeight:700,color:'#201F1E'}}>{activeImage.name}</div>
              <div style={{fontSize:11,color:C.subtle,marginTop:2}}>{activeImage.path}</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes scaleIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}
        .forecast-badge { background:#F3F2F1; color:#605E5C; font-size:9px; border-radius:4px; padding:2px 5px; font-weight:600; border:1px solid #EDEBE9; }
      `}</style>
    </div>
  )
}
