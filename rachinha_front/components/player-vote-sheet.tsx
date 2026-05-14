"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileUser, Meh, RotateCcw, Star, ThumbsDown, ThumbsUp, Undo2 } from "lucide-react";

import { User } from "@/interface/users";
import { getSportIcon } from "@/lib/getSportIcon";
import { BookingPlayerVote } from "@/services/bookings";
import { UserProfileCard } from "@/components/card/user-profile-card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type VoteCandidate = {
  id: string;
  name: string;
  username: string;
  photoUrl?: string;
  initials?: string;
  skillLevel?: number;
  cardVariant?: User["active_card_template"];
  existingVote?: BookingPlayerVote;
};

const CARD_SILHOUETTE_PATH =
  "M107.609 83.1562V1065.41C107.609 1086.74 119.984 1106.15 139.333 1115.14L507.974 1286.42C528.089 1295.77 551.307 1295.77 571.422 1286.42L940.062 1115.14C959.411 1106.15 971.786 1086.74 971.786 1065.41V83.1562C971.786 63.8333 956.125 48.1719 936.802 48.1719H142.594C123.271 48.1719 107.609 63.8333 107.609 83.1562Z";

const CARD_EXIT_ANIMATION_MS = 400;
const CARD_RETURN_ANIMATION_MS = 400;

interface PlayerVoteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "right" | "bottom";
  bookingModality?: string;
  candidates: VoteCandidate[];
  votesByPlayerId: Record<string, BookingPlayerVote>;
  isSubmitting: boolean;
  onVote: (playerId: string, vote: BookingPlayerVote) => Promise<boolean>;
  onUndoVote: (playerId: string) => void;
  onResetVotes?: () => void;
}

export function PlayerVoteSheet({
  open,
  onOpenChange,
  side,
  bookingModality,
  candidates,
  votesByPlayerId,
  isSubmitting,
  onVote,
  onUndoVote,
  onResetVotes,
}: PlayerVoteSheetProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isVoteAnimating, setIsVoteAnimating] = useState(false);
  const [isAwaitingVoteResult, setIsAwaitingVoteResult] = useState(false);
  const [voteHistory, setVoteHistory] = useState<string[]>([]);
  const [revisitingCandidateId, setRevisitingCandidateId] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const pendingCandidates = useMemo(
    () => candidates.filter((candidate) => typeof votesByPlayerId[candidate.id] === "undefined"),
    [candidates, votesByPlayerId]
  );

  const revisitingCandidate = useMemo(
    () => (revisitingCandidateId ? candidates.find((candidate) => candidate.id === revisitingCandidateId) ?? null : null),
    [candidates, revisitingCandidateId]
  );

  const activeCandidate = revisitingCandidate ?? pendingCandidates[0] ?? null;
  const isBusySubmitting = isSubmitting || isAwaitingVoteResult;
  const totalVotes = candidates.filter((candidate) => typeof votesByPlayerId[candidate.id] !== "undefined").length;
  const progressPercent = candidates.length > 0 ? Math.round((totalVotes / candidates.length) * 100) : 0;
  const isDone = candidates.length > 0 && pendingCandidates.length === 0 && !revisitingCandidate;
  const canUndoLastVote = voteHistory.length > 0 && !isBusySubmitting && !isVoteAnimating;
  const shouldDisableVoteButtons = isDone || !activeCandidate || isBusySubmitting || isVoteAnimating;

  useEffect(() => {
    if (!open) return;
    setVoteHistory([]);
    setRevisitingCandidateId(null);
    setIsAwaitingVoteResult(false);
  }, [open]);

  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    dragStartRef.current = null;
  }, [activeCandidate?.id, open]);

  const resolveVoteFromDrag = (x: number, y: number): BookingPlayerVote | null => {
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const threshold = 90;

    if (absX >= threshold && absX > absY) return x > 0 ? 1 : -1;
    if (y >= threshold && absY > absX) return 0;
    return null;
  };

  const getVoteExitOffset = (vote: BookingPlayerVote) => {
    if (vote === 1) return { x: 450, y: -45 };
    if (vote === -1) return { x: -450, y: -45 };
    return { x: 0, y: 580 };
  };

  const submitVote = async (vote: BookingPlayerVote) => {
    if (!activeCandidate || isSubmitting || isVoteAnimating) return;
    const votedCandidateId = activeCandidate.id;

    setIsVoteAnimating(true);
    setIsDragging(false);
    setDragOffset(getVoteExitOffset(vote));

    await new Promise((resolve) => setTimeout(resolve, CARD_EXIT_ANIMATION_MS));

    // Assim que termina a saida, mostra loading imediatamente para evitar gap visual.
    setIsAwaitingVoteResult(true);
    setIsVoteAnimating(false);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);

    const saved = await onVote(votedCandidateId, vote);

    if (saved) {
      setVoteHistory((prev) => [...prev, votedCandidateId]);
      if (revisitingCandidateId === votedCandidateId) {
        setRevisitingCandidateId(null);
      }
    }

    setIsAwaitingVoteResult(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activeCandidate || isBusySubmitting || isVoteAnimating) return;
    event.preventDefault();
    dragStartRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    setDragOffset({
      x: event.clientX - dragStartRef.current.x,
      y: event.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerEnd = async (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartRef.current = null;

    const vote = resolveVoteFromDrag(dragOffset.x, dragOffset.y);
    if (vote === null) {
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
      return;
    }

    await submitVote(vote);
  };

  const handleUndoLastVote = () => {
    if (!canUndoLastVote) return;

    const lastVotedPlayerId = voteHistory[voteHistory.length - 1];
    if (!lastVotedPlayerId) return;

    onUndoVote(lastVotedPlayerId);
    setVoteHistory((prev) => prev.slice(0, -1));
    setRevisitingCandidateId(lastVotedPlayerId);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const dragIntent: BookingPlayerVote | null = (() => {
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);
    const previewThreshold = 8;

    if (absX >= previewThreshold && absX > absY) return dragOffset.x > 0 ? 1 : -1;
    if (dragOffset.y >= previewThreshold && absY > absX) return 0;
    return null;
  })();

  const dragDominant = Math.max(Math.abs(dragOffset.x), Math.max(dragOffset.y, 0));
  const dragPreviewStrength = Math.min(Math.max((dragDominant - 4) / 120, 0), 1);

  const stampConfig = (() => {
    if (dragIntent === 1) {
      return {
        lines: ["JOGOU", "MUITO"],
        strokeColor: "#86efac",
        textColor: "#dcfce7",
        tintRgb: "22, 163, 74",
      };
    }

    if (dragIntent === -1) {
      return {
        lines: ["JOGOU", "NADA"],
        strokeColor: "#fca5a5",
        textColor: "#fee2e2",
        tintRgb: "220, 38, 38",
      };
    }

    if (dragIntent === 0) {
      return {
        lines: ["REGULAR"],
        strokeColor: "#d4d4d8",
        textColor: "#f4f4f5",
        tintRgb: "113, 113, 122",
      };
    }

    return null;
  })();

  const tintOpacity = stampConfig
    ? (dragIntent === 0 ? 0.06 + dragPreviewStrength * 0.2 : 0.08 + dragPreviewStrength * 0.24)
    : 0;
  const stampOpacity = stampConfig ? 0.2 + dragPreviewStrength * 0.75 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={`border-zinc-800 bg-zinc-950 p-0 flex flex-col overflow-hidden ${side === "right" ? "w-[460px] sm:max-w-lg h-[100dvh]" : "h-[88dvh] max-h-[88dvh]"}`}
      >
        <SheetHeader className="items-start px-6 py-5 border-b border-zinc-800 text-left">
          <div className="flex items-center gap-3 min-w-0">
            <Star className="h-5 w-5 text-green-400 flex-shrink-0" />
            <SheetTitle className="text-xl text-zinc-100">Avalie os jogadores</SheetTitle>
          </div>
          <SheetDescription className="text-left text-xs text-zinc-400">
            Vote nos confirmados em como eles jogaram!
          </SheetDescription>
          <div className="mt-1 w-full space-y-1.5 text-left">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">{progressPercent}% concluido</p>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          {!candidates.length && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
              Nenhum jogador elegível para avaliação nesta partida.
            </div>
          )}

          {candidates.length > 0 && (
            <>
              <div className="relative flex-1 min-h-[260px] sm:min-h-[320px] flex items-center justify-center overflow-hidden">
                {isDone ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center gap-4">
                    <FileUser className="h-14 w-14 text-green-400" />
                    <div className="space-y-1">
                      <p className="text-base font-semibold ">Avaliação concluída</p>
                      <p className="text-sm text-zinc-400">Sua avaliação vai ajudar a equilibrar a skill do seu grupo!</p>
                    </div>
                    {onResetVotes && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-zinc-900 border-zinc-700 hover:border-zinc-400 hover:text-zinc-100 cursor-pointer"
                        onClick={() => {
                          onResetVotes();
                          setVoteHistory([]);
                          setRevisitingCandidateId(null);
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Avaliar novamente
                      </Button>
                    )}
                  </div>
                ) : isBusySubmitting ? (
                  <div className="relative mx-auto w-[min(68vw,280px)] sm:w-[min(58vw,300px)] animate-pulse">
                    <svg
                      className="block w-full h-auto drop-shadow-[0_0_24px_rgba(0,0,0,0.55)]"
                      viewBox="0 0 1080 1350"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path
                        d={CARD_SILHOUETTE_PATH}
                        fill="url(#vote-skeleton-gradient)"
                      />
                      <defs>
                        <linearGradient id="vote-skeleton-gradient" x1="130" y1="120" x2="940" y2="1200" gradientUnits="userSpaceOnUse">
                          <stop stopColor="rgba(63,63,70,0.78)" />
                          <stop offset="1" stopColor="rgba(39,39,42,0.5)" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                ) : (
                  <div
                    className={`w-full max-w-sm select-none touch-none ${isDragging ? "transition-none" : "transition-all ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
                    style={{
                      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x / 18}deg) scale(${isVoteAnimating ? 0.93 : 1})`,
                      opacity: isVoteAnimating ? 0.12 : 1,
                      transitionDuration: `${isVoteAnimating ? CARD_EXIT_ANIMATION_MS : CARD_RETURN_ANIMATION_MS}ms`,
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(event) => {
                      void handlePointerEnd(event);
                    }}
                    onPointerCancel={(event) => {
                      void handlePointerEnd(event);
                    }}
                  >
                    <div className="relative mx-auto w-[min(90vw,320px)] cursor-grab active:cursor-grabbing">
                      <UserProfileCard
                        name={activeCandidate.name.toUpperCase()}
                        username={`@${activeCandidate.username.toLowerCase()}`}
                        photoUrl={activeCandidate.photoUrl}
                        initials={activeCandidate.initials}
                        skillLevel={activeCandidate.skillLevel}
                        variant={activeCandidate.cardVariant}
                        sport={bookingModality ? { name: bookingModality, icon: getSportIcon(bookingModality) } : undefined}
                        overlayPreset="standard"
                      />

                      <svg
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        viewBox="0 0 1080 1350"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <defs>
                          <filter id="vote-overlay-blur" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                            <feGaussianBlur stdDeviation="24" />
                          </filter>
                        </defs>

                        <path
                          d={CARD_SILHOUETTE_PATH}
                          fill={stampConfig ? `rgba(${stampConfig.tintRgb}, ${Math.min(tintOpacity * 0.75, 0.24)})` : "rgba(0,0,0,0)"}
                          filter="url(#vote-overlay-blur)"
                          style={{ transition: "fill 700ms cubic-bezier(0.22,1,0.36,1)" }}
                        />

                        <path
                          d={CARD_SILHOUETTE_PATH}
                          fill={stampConfig ? `rgba(${stampConfig.tintRgb}, ${tintOpacity})` : "rgba(0,0,0,0)"}
                          style={{ transition: "fill 700ms cubic-bezier(0.22,1,0.36,1)" }}
                        />

                        {stampConfig && (
                          <g
                            transform="translate(540 260) rotate(-12)"
                            opacity={stampOpacity}
                            style={{
                              transition: "opacity 700ms cubic-bezier(0.22,1,0.36,1)",
                              filter: "drop-shadow(0 0 10px rgba(0,0,0,0.35)) drop-shadow(0 0 6px rgba(255,255,255,0.12))",
                            }}
                          >
                            <rect
                              x={-190}
                              y={stampConfig.lines.length > 1 ? -78 : -58}
                              width={380}
                              height={stampConfig.lines.length > 1 ? 156 : 116}
                              rx={10}
                              fill="rgba(0, 0, 0, 0.22)"
                              stroke={stampConfig.strokeColor}
                              strokeWidth={8}
                            />
                            {stampConfig.lines.length > 1 ? (
                              <>
                                <text
                                  x="0"
                                  y="-26"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill={stampConfig.textColor}
                                  fontSize="56"
                                  fontWeight="800"
                                  letterSpacing="1"
                                  fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
                                >
                                  {stampConfig.lines[0]}
                                </text>
                                <text
                                  x="0"
                                  y="34"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill={stampConfig.textColor}
                                  fontSize="56"
                                  fontWeight="800"
                                  letterSpacing="1"
                                  fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
                                >
                                  {stampConfig.lines[1]}
                                </text>
                              </>
                            ) : (
                              <text
                                x="0"
                                y="2"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={stampConfig.textColor}
                                fontSize="58"
                                fontWeight="800"
                                letterSpacing="1"
                                fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
                              >
                                {stampConfig.lines[0]}
                              </text>
                            )}
                          </g>
                        )}
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-10 p-0 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-400 hover:text-zinc-100 disabled:opacity-40 cursor-pointer"
                  disabled={!canUndoLastVote}
                  onClick={handleUndoLastVote}
                  title="Desfazer último voto"
                  aria-label="Desfazer último voto"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs sm:text-sm cursor-pointer bg-red-800 hover:bg-red-700/20 border-red-400 hover:border-red-400 hover:text-red-400 backdrop-blur-sm group"
                  disabled={shouldDisableVoteButtons}
                  onClick={() => {
                    void submitVote(-1);
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ThumbsDown className="h-4 w-4" />
                    <span>Jogou nada</span>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs sm:text-sm cursor-pointer bg-zinc-800 hover:bg-zinc-700/20 border-zinc-400 hover:border-zinc-400 hover:text-zinc-400 backdrop-blur-sm group"
                  disabled={shouldDisableVoteButtons}
                  onClick={() => {
                    void submitVote(0);
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Meh className="h-4 w-4" />
                    <span>Regular</span>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs sm:text-sm cursor-pointer bg-green-800 hover:bg-green-700/20 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
                  disabled={shouldDisableVoteButtons}
                  onClick={() => {
                    void submitVote(1);
                  }}
                >
                  <span className="inline-flex items-center gap-1.5 ">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Jogou muito</span>
                  </span>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}