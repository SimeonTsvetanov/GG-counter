import { useEffect, useMemo, useRef, useState } from "react";
import { PlayerCard } from "./components/player-card";
import { ThemeToggle } from "./components/theme-toggle";
import { Button } from "./components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { useGameState } from "./hooks/use-game-state";
import { useOnlineStatus } from "./hooks/use-online-status";
import { usePwaInstall } from "./hooks/use-pwa-install";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import {
  Download,
  LayoutList,
  Plus,
  RefreshCw,
  Share2,
  Trophy,
} from "lucide-react";
import meepleIconUrl from "../meeple-plus.svg?url";

// no hard limit on players

export default function App() {
  const {
    state,
    addPlayer,
    removePlayer,
    renamePlayer,
    adjustScore,
    resetScores,
    resetGame,
    summary,
  } = useGameState();
  const isOnline = useOnlineStatus();
  const { canInstall, promptInstall, isInstalled } = usePwaInstall();
  const [newPlayerName, setNewPlayerName] = useState("");
  const [installDismissed, setInstallDismissed] = useState(false);
  const [isLeaderboardDialogOpen, setIsLeaderboardDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isLeaderboardInView, setIsLeaderboardInView] = useState(true);

  const leaderId = summary.leader?.id ?? null;
  const playerCount = state.players.length;
  const showInstallBanner = canInstall && !isInstalled && !installDismissed;
  const containerClass = "mx-auto w-full max-w-5xl px-0 sm:px-4 lg:px-8";
  const sortedPlayers = useMemo(
    () => [...state.players].sort((a, b) => b.score - a.score),
    [state.players]
  );

  const addInputRef = useRef<HTMLInputElement>(null);
  const addCardRef = useRef<HTMLDivElement>(null);
  const leaderboardCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!leaderboardCardRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsLeaderboardInView(entry?.isIntersecting ?? true);
      },
      { threshold: 0.15 }
    );

    observer.observe(leaderboardCardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInstalled) {
      setInstallDismissed(true);
    }
  }, [isInstalled]);

  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (trimmed.length === 0) {
      return;
    }
    addPlayer(trimmed);
    setNewPlayerName("");
  };

  const handleShare = async () => {
    if (sortedPlayers.length === 0) {
      return;
    }

    const medalEmojis = ["🥇", "🥈", "🥉"];
    const ordinal = (index: number) => {
      const value = index + 1;
      const tens = value % 100;
      if (tens >= 11 && tens <= 13) {
        return `${value}th`;
      }
      switch (value % 10) {
        case 1:
          return `${value}st`;
        case 2:
          return `${value}nd`;
        case 3:
          return `${value}rd`;
        default:
          return `${value}th`;
      }
    };

    const lines = sortedPlayers.map((player, index) => {
      const medal = medalEmojis[index] ?? "🎲";
      return `${medal} ${ordinal(index)} — ${player.name} (${
        player.score
      } pts)`;
    });

    const text = [
      "🏆 GG Counter Leaderboard",
      "",
      ...lines,
      "",
      `🎯 Total score: ${summary.totalScore}`,
      `👥 Players: ${state.players.length}`,
      `🕒 Snapshot: ${new Date().toLocaleString()}`,
    ].join("\n");

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "GG Counter session", text });
        setIsLeaderboardDialogOpen(false);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setIsLeaderboardDialogOpen(false);
        if (typeof window !== "undefined") {
          window.alert("Session summary copied to clipboard.");
        }
        return;
      }
    } catch (error) {
      console.error("Sharing failed", error);
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setIsLeaderboardDialogOpen(false);
        if (typeof window !== "undefined") {
          window.alert("Session summary copied to clipboard.");
        }
      } catch (clipboardError) {
        console.error("Clipboard copy failed", clipboardError);
      }
    }
  };

  const handleInstallRequest = () => {
    void promptInstall().then((accepted) => {
      if (accepted) {
        setInstallDismissed(true);
      }
    });
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuickAdd = () => {
    addCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    addInputRef.current?.focus();
  };

  const handleResetConfirm = () => {
    resetScores();
    setIsResetDialogOpen(false);
  };

  const handleClearConfirm = () => {
    resetGame();
    setIsClearDialogOpen(false);
  };

  const sharedCardWidth = "mx-auto w-full max-w-lg";

  const addPlayerCard = (
    <div ref={addCardRef} className={sharedCardWidth}>
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            Add Player
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {state.players.length} players
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              ref={addInputRef}
              value={newPlayerName}
              onChange={(event) => setNewPlayerName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleAddPlayer();
                }
              }}
              placeholder="Player Name"
              aria-label="Player name"
              className="flex-1 min-w-0"
            />
            <Button onClick={handleAddPlayer} className="w-full sm:w-auto">
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Player name</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {playerCount} players
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const hasPlayers = state.players.length > 0;
  const topThree = sortedPlayers.slice(0, 3);
  const remainingLeaderboard = sortedPlayers.slice(3);

  const renderHeaderContent = () => {
    if (isLeaderboardInView) {
      return (
        <div className="flex flex-col gap-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LayoutList className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                GG Counter
              </p>
              <p className="text-xs text-muted-foreground">
                Boardgames score tracker
              </p>
            </div>
          </div>
          <div className="flex w-full justify-end sm:w-auto">
            <ThemeToggle />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between gap-3 py-3">
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleScrollTop}
            className="shrink-0"
            aria-label="Scroll to top"
          >
            <img src={meepleIconUrl} alt="GG Counter" className="h-5 w-5" />
          </Button>

          <Dialog
            open={isLeaderboardDialogOpen}
            onOpenChange={setIsLeaderboardDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
{