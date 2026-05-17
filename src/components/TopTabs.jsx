import { useNav } from '../context/NavigationContext'
import { TABS, tabOfView } from '../navConfig'

export default function TopTabs() {
  const { view, navigate } = useNav()
  const activeTab = tabOfView(view)
  return (
    <div className="ttabs">
      <div className="ttabs-logo">
        <div className="ttabs-mark">PDB</div>
        <div className="ttabs-name">PropDatabase</div>
      </div>
      <div className="ttabs-list">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`ttab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => navigate(t.default)}
            title={t.label}
          >
            <span className="ttab-ico">{t.icon}</span>
            <span className="ttab-label">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="ttabs-user">
        <div className="ttabs-av">AS</div>
        <div className="ttabs-uname">
          <div style={{fontSize:11,fontWeight:600,color:'#1d1d1f',lineHeight:1.2}}>Álvaro Sierra</div>
          <div style={{fontSize:10,color:'#8e8e93'}}>Oficinas · Madrid</div>
        </div>
      </div>
    </div>
  )
}
