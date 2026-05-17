import { useNav } from '../context/NavigationContext'
import { TABS, tabOfView } from '../navConfig'

function isItemActive(item, view) {
  if (item.view === view) return true
  return Array.isArray(item.aliases) && item.aliases.includes(view)
}

function Item({ item, view, navigate }) {
  const active = isItemActive(item, view)
  return (
    <div
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={() => navigate(item.view)}
    >
      {item.icon}
      <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
        {item.label}
      </span>
      {item.badge != null && (
        <span className="nav-badge" style={item.badgeStyle || undefined}>{item.badge}</span>
      )}
      {item.dyn && <span className="nav-dyn">Dynamics</span>}
    </div>
  )
}

export default function Nav() {
  const { view, navigate } = useNav()
  const activeTabId = tabOfView(view)
  const tab = TABS.find(t => t.id === activeTabId) || TABS[0]

  return (
    <nav>
      <div className="nav-tabhead">
        <div className="nav-tabhead-ico">{tab.icon}</div>
        <div className="nav-tabhead-label">{tab.label}</div>
      </div>

      {tab.items && (
        <div className="nav-list">
          {tab.items.map(it => (
            <Item key={it.view} item={it} view={view} navigate={navigate} />
          ))}
        </div>
      )}

      {tab.groups && (
        <div className="nav-list">
          {tab.groups.map((g, gi) => (
            <div key={gi} className="nav-group">
              <div className="nav-group-label">{g.label}</div>
              {g.items.map(it => (
                <Item key={it.view} item={it} view={view} navigate={navigate} />
              ))}
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}
