'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const activities = [
  {
    id: 1,
    user: 'João Silva',
    action: 'registrou uma nova colheita',
    time: '2 horas atrás',
    initials: 'JS',
  },
  {
    id: 2,
    user: 'Maria Santos',
    action: 'atualizou o planejamento de milho',
    time: '4 horas atrás',
    initials: 'MS',
  },
  {
    id: 3,
    user: 'Pedro Costa',
    action: 'adicionou nova irrigação',
    time: '6 horas atrás',
    initials: 'PC',
  },
  {
    id: 4,
    user: 'Ana Oliveira',
    action: 'registrou controle de pragas',
    time: '8 horas atrás',
    initials: 'AO',
  },
]

export function RecentActivities() {
  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{activity.initials}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.user}
            </p>
            <p className="text-sm text-muted-foreground">
              {activity.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {activity.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}