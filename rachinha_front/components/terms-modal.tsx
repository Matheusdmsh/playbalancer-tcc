"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept?: () => void
}

export function TermsModal({ open, onOpenChange, onAccept }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-3xl">
        <DialogHeader>
          <DialogTitle>Termos e Condições</DialogTitle>
          <DialogDescription>Por favor, leia atentamente os termos e condições antes de continuar.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] mt-4 pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-lg font-bold mb-2">1. Termos de Uso da Plataforma Rachinha.com</h3>
              <p className="text-zinc-400 mb-2">
                Bem-vindo à plataforma Rachinha.com. Ao acessar ou utilizar nossos serviços, você concorda com estes termos
                e condições. Por favor, leia-os cuidadosamente.
              </p>
              <p className="text-zinc-400 mb-2">
                1.1 A plataforma Rachinha.com é um serviço de intermediação entre proprietários de quadras esportivas e
                usuários que desejam reservá-las.
              </p>
              <p className="text-zinc-400 mb-2">
                1.2 Ao se cadastrar como administrador, você declara ser o proprietário legítimo ou representante
                autorizado do espaço esportivo anunciado.
              </p>
              <p className="text-zinc-400 mb-2">
                1.3 O Rachinha.com não se responsabiliza pela qualidade das quadras ou serviços oferecidos pelos
                administradores, atuando apenas como intermediária.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-2">2. Responsabilidades dos Administradores</h3>
              <p className="text-zinc-400 mb-2">
                2.1 Como administrador, você é responsável por fornecer informações precisas e atualizadas sobre seu
                espaço esportivo, incluindo disponibilidade, preços e condições.
              </p>
              <p className="text-zinc-400 mb-2">
                2.2 É sua responsabilidade manter seu espaço em condições adequadas para uso, conforme anunciado na
                plataforma.
              </p>
              <p className="text-zinc-400 mb-2">
                2.3 Você deve respeitar as reservas confirmadas através da plataforma e garantir que o espaço esteja
                disponível nos horários reservados.
              </p>
              <p className="text-zinc-400 mb-2">
                2.4 É proibido discriminar usuários com base em raça, gênero, orientação sexual, religião ou qualquer
                outra característica protegida por lei.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-2">3. Pagamentos e Comissões</h3>
              <p className="text-zinc-400 mb-2">
                3.1 O Rachinha.com cobra uma comissão de 10% sobre cada reserva realizada através da plataforma.
              </p>
              <p className="text-zinc-400 mb-2">
                3.2 Os pagamentos são processados através de nosso sistema seguro e transferidos para sua conta bancária
                em até 7 dias úteis após a conclusão da reserva.
              </p>
              <p className="text-zinc-400 mb-2">3.3 Em caso de cancelamento, nossa política prevê:</p>
              <ul className="list-disc pl-6 text-zinc-400 mb-2">
                <li>Cancelamento com mais de 48h de antecedência: reembolso total ao usuário</li>
                <li>Cancelamento entre 24h e 48h: reembolso de 50% ao usuário</li>
                <li>Cancelamento com menos de 24h: sem reembolso</li>
              </ul>
              <p className="text-zinc-400 mb-2">
                3.4 O Rachinha.com se reserva o direito de reter pagamentos em caso de disputas ou violações dos termos de
                uso.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-2">4. Conteúdo e Propriedade Intelectual</h3>
              <p className="text-zinc-400 mb-2">
                4.1 Ao publicar conteúdo na plataforma (fotos, descrições, etc.), você garante que possui os direitos
                necessários sobre esse conteúdo.
              </p>
              <p className="text-zinc-400 mb-2">
                4.2 Você concede à Rachinha.com uma licença não exclusiva para usar, reproduzir e exibir o conteúdo
                publicado, com o propósito de promover seu espaço e a plataforma.
              </p>
              <p className="text-zinc-400 mb-2">
                4.3 É proibido publicar conteúdo que viole direitos autorais, marcas registradas ou outros direitos de
                propriedade intelectual.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-2">5. Privacidade e Dados Pessoais</h3>
              <p className="text-zinc-400 mb-2">
                5.1 O Rachinha.com coleta e processa dados pessoais de acordo com sua Política de Privacidade, disponível em
                [link].
              </p>
              <p className="text-zinc-400 mb-2">
                5.2 Como administrador, você terá acesso a dados pessoais dos usuários que reservarem seu espaço. Você
                concorda em:
              </p>
              <ul className="list-disc pl-6 text-zinc-400 mb-2">
                <li>Usar esses dados apenas para fins relacionados à reserva</li>
                <li>Não compartilhar esses dados com terceiros</li>
                <li>Implementar medidas de segurança adequadas para proteger esses dados</li>
                <li>Excluir esses dados quando não forem mais necessários</li>
              </ul>
              <p className="text-zinc-400 mb-2">
                5.3 Você concorda em notificar o Rachinha.com imediatamente em caso de violação de dados ou acesso não
                autorizado.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-2">6. Suspensão e Encerramento</h3>
              <p className="text-zinc-400 mb-2">
                6.1 O Rachinha.com se reserva o direito de suspender ou encerrar sua conta de administrador em caso de
                violação destes termos ou de reclamações fundamentadas de usuários.
              </p>
              <p className="text-zinc-400 mb-2">
                6.2 Em caso de suspensão ou encerramento, as reservas já confirmadas serão honradas, mas você não poderá
                aceitar novas reservas.
              </p>
              <p className="text-zinc-400 mb-2">
                6.3 Você pode encerrar sua conta a qualquer momento, mas deve honrar as reservas já confirmadas.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-2">7. Alterações nos Termos</h3>
              <p className="text-zinc-400 mb-2">
                7.1 O Rachinha.com pode alterar estes termos a qualquer momento, notificando os administradores por email.
              </p>
              <p className="text-zinc-400 mb-2">
                7.2 O uso continuado da plataforma após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-2">8. Disposições Gerais</h3>
              <p className="text-zinc-400 mb-2">8.1 Estes termos são regidos pelas leis do Brasil.</p>
              <p className="text-zinc-400 mb-2">
                8.2 Qualquer disputa relacionada a estes termos será resolvida nos tribunais da cidade de São Paulo.
              </p>
              <p className="text-zinc-400 mb-2">
                8.3 Se qualquer disposição destes termos for considerada inválida ou inexequível, as demais disposições
                permanecerão em vigor.
              </p>
              <p className="text-zinc-400 mb-2">
                8.4 A falha do Rachinha.com em fazer cumprir qualquer direito ou disposição destes termos não constitui
                renúncia a tal direito ou disposição.
              </p>
            </section>

            <p className="text-zinc-400 font-medium">
              Ao clicar em "Aceitar Termos", você confirma que leu, entendeu e concorda com estes termos e condições.
            </p>
          </div>
        </ScrollArea>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            className="bg-green-500 hover:bg-green-600"
            onClick={() => {
              if (onAccept) onAccept()
              onOpenChange(false)
            }}
          >
            Aceitar Termos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
