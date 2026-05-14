import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, DollarSign, Users } from "lucide-react"

export default function UserDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-zinc-500">+1 em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Horas Reservadas</CardTitle>
            <Clock className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12h</div>
            <p className="text-xs text-zinc-500">+3h em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 480</div>
            <p className="text-xs text-zinc-500">+R$ 120 em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Amigos Convidados</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-zinc-500">+2 em relação ao mês passado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Próximas Reservas</CardTitle>
            <CardDescription>Suas próximas reservas agendadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-zinc-800">
                  <div className="flex-shrink-0 w-12 h-12 rounded-md bg-zinc-700 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Quadra Ace</p>
                    <p className="text-xs text-zinc-400">Quinta-feira, 23 de Maio • 19:00</p>
                  </div>
                  <div className="text-sm font-medium">R$ 120</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Mensagens Recentes</CardTitle>
            <CardDescription>Conversas com proprietários de quadras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-zinc-800">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                    <Users className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Quadra Ace</p>
                    <p className="text-xs text-zinc-400 truncate">
                      Olá! Sua reserva foi confirmada para quinta-feira...
                    </p>
                  </div>
                  <div className="text-xs text-zinc-500">2h atrás</div>
                </div>
              ))}

              <div className="flex items-center justify-center p-3">
                <p className="text-sm text-zinc-500">Sem mais mensagens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
