'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OverviewCards } from './overview-cards'
import { RecentActivities } from './recent-activities'
import { ProductionChart } from './production-chart'
import { FinancialChart } from './financial-chart'

export function DashboardContent() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <OverviewCards />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Produção Mensal</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ProductionChart />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivities />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Propriedade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Área Total</span>
                <span className="text-sm text-muted-foreground">150 ha</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Área Plantada</span>
                <span className="text-sm text-muted-foreground">120 ha</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Setores</span>
                <span className="text-sm text-muted-foreground">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lotes</span>
                <span className="text-sm text-muted-foreground">24</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}