import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Calendar, MoreVertical, Edit, Trash2, MapPin, Flag } from "lucide-react";
import React from "react";
import { getSportIcon } from "@/lib/getSportIcon";

interface BookingCardCompactProps {
  booking: any;
  groupName: string;
  isGroupAdmin: boolean;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  onEditBooking: (booking: any) => void;
  onCancelBooking: (booking: any) => void;
  handlePresence: (bookingId: string, action: "confirm" | "cancel") => void;
  invite?: any;
  buttonState?: "confirm" | "cancel" | "disabled" | "not_invited" | "waiting";
}

export const BookingCardCompact: React.FC<BookingCardCompactProps> = ({
  booking,
  groupName,
  isGroupAdmin,
  formatDate,
  formatTime,
  onEditBooking,
  onCancelBooking,
  handlePresence,
  invite,
  buttonState,
}) => {
  return (
    <Link key={booking._id} href={`/user/booking/${booking._id}`} className="no-underline">
      <Card
        className="overflow-hidden border-[#27272a] hover:border-green-400 transition-all duration-300 shadow-lg hover:shadow-green-500/30 cursor-pointer group bg-[#18181b] hover:bg-zinc-800/50"
      >
        {/* Header com turma (grupo) e menu */}
        <CardHeader className="pb-2 pt-2">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              {getSportIcon(booking.modality)}
              <div className="min-w-0">
                <CardTitle className="text-sm capitalize text-white font-semibold">
                  {groupName || booking.modality || "Turma"}
                </CardTitle>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </p>
              </div>
            </div>
            <div onClick={(e) => e.preventDefault()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700 text-white">
                  {/* Presença: primeira opção do menu */}
                  {buttonState === "confirm" && (
                    <DropdownMenuItem
                      className="hover:bg-zinc-700 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePresence(booking._id, "confirm");
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-green-400" />
                      <span>Confirmar Presença</span>
                    </DropdownMenuItem>
                  )}
                  {buttonState === "cancel" && (
                    <DropdownMenuItem
                      className="hover:bg-zinc-700 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePresence(booking._id, "cancel");
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-red-400" />
                      <span>Cancelar Presença</span>
                    </DropdownMenuItem>
                  )}
                  {/* Admin opções */}
                  {isGroupAdmin && (
                    <>
                      <DropdownMenuItem
                        className="hover:bg-zinc-700 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          onEditBooking(booking);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar Racha</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 hover:!text-red-500 hover:!bg-red-900/50 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          onCancelBooking(booking);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Cancelar Racha</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        {/* Tags com informações */}
        <div className="border-t border-zinc-700/50 px-4 py-2"></div>
        <CardContent className="pb-2 pt-0">
          <div className="flex flex-wrap gap-1 mb-1">
            {/* Tag de modalidade */}
            {booking.modality && (
              <div className="bg-green-900/40 border border-green-700/60 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                <Flag className="h-3 w-3 text-green-400" />
                <span className="text-green-200">{booking.modality}</span>
              </div>
            )}
            {/* Tag de local */}
            {booking.location?.alt && (
              <div className="bg-green-900/40 border border-green-700/60 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3 text-green-400" />
                <span className="text-green-200">{booking.location.alt}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
