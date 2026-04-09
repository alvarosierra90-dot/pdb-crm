import { createContext, useContext, useState } from 'react'

const TasksContext = createContext()

const todayStr = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

let nextId = 7 // mock data starts at TAR-006

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([])

  const addTask = (task) => {
    const id = `TAR-${String(nextId++).padStart(3,'0')}`
    const today = todayStr()
    setTasks(prev => [{
      id,
      as:   task.asunto,
      tipo: task.tipo,
      resp: task.responsable,
      asig: 'Sierra Alvaro',
      team: 'Leasing Oficinas MAD',
      rT:   task.refTipo,
      ref:  task.refNombre,
      est:  'Pendiente',
      prio: task.prioridad,
      ini:  today,
      lim:  task.fechaLimite || '',
      upd:  today,
      desc: task.descripcion || '',
    }, ...prev])
  }

  return (
    <TasksContext.Provider value={{ tasks, addTask }}>
      {children}
    </TasksContext.Provider>
  )
}

export const useTasks = () => useContext(TasksContext)
