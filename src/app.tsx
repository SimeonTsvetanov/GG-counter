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
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3 min-w-0">
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
          <div className="flex-shrink-0">
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
                variant="outline"
                size="icon"
                aria-label="Open leaderboard"
              >
                <Trophy className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Leaderboard</DialogTitle>
                <DialogDescription>
                  Highlights from the current session
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  {topThree.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No players yet. Add someone to get started.
                    </p>
                  ) : (
                    topThree.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-md bg-card/80 px-3 py-2 shadow-sm"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {["🥇", "🥈", "🥉"][index]} {player.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {player.score} pts
                        </span>
                      </div>
                    ))
                  )}
                </div>
                {remainingLeaderboard.length > 0 && (
                  <div className="space-y-1">
                    {remainingLeaderboard.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          🎲 {index + 4} — {player.name}
                        </span>
                        <span className="text-muted-foreground">
                          {player.score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  onClick={() => {
                    void handleShare();
                  }}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setIsResetDialogOpen(true)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Reset scores
                </Button>
                <DialogClose asChild>
                  <Button className="w-full sm:w-auto">OK</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="icon"
            onClick={handleQuickAdd}
            aria-label="Add player"
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              void handleShare();
            }}
            aria-label="Share session"
            className="shrink-0"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsClearDialogOpen(true)}
            aria-label="Clear session"
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <ThemeToggle />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="safe-area flex w-full min-h-dvh flex-col">
        <header className="sticky top-0 z-20 bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className={containerClass}>{renderHeaderContent()}</div>
        </header>

        {(!isOnline || showInstallBanner) && (
          <div className={`${containerClass} mt-3`}>
            <div className="rounded-lg bg-card p-4 text-card-foreground shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2 text-sm">
                  {!isOnline && (
                    <p className="font-medium text-destructive">
                      You are offline. Changes are saved locally and will sync
                      when you reconnect.
                    </p>
                  )}
                  {showInstallBanner && (
                    <p className="font-medium">
                      Install GG Counter for quicker access and offline support.
                    </p>
                  )}
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                  {showInstallBanner && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleInstallRequest}
                      className="w-full sm:w-auto"
                    >
                      <Download className="mr-2 h-4 w-4" /> Install app
                    </Button>
                  )}
                  {showInstallBanner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInstallDismissed(true)}
                      className="w-full sm:w-auto"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1">
          <div className={`${containerClass} flex flex-col gap-6 py-6`}>
            {!hasPlayers && addPlayerCard}

            {hasPlayers && (
              <>
                <div className="mx-auto w-full max-w-lg sm:max-w-none">
                  <section className="grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {state.players.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        isLeader={leaderId === player.id}
                        onRename={renamePlayer}
                        onRemove={removePlayer}
                        onAdjust={adjustScore}
                        className="w-full"
                      />
                    ))}
                  </section>
                </div>
                <div className="mt-2 w-full">{addPlayerCard}</div>
              </>
            )}

            <div ref={leaderboardCardRef} className={sharedCardWidth}>
              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Trophy className="h-4 w-4" /> Leaderboard
                  </CardTitle>
                  {summary.leader ? (
                    <span className="text-sm font-medium text-primary">
                      {summary.leader.name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No players yet
                    </span>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {topThree.length === 0 ? (
                      <CardDescription>
                        Add players to populate the leaderboard.
                      </CardDescription>
                    ) : (
                      topThree.map((player, index) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between rounded-md bg-card/80 px-3 py-2 shadow-sm"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {["🥇", "🥈", "🥉"][index]} {player.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {player.score} pts
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {remainingLeaderboard.length > 0 && (
                    <div className="grid gap-1 text-xs text-muted-foreground">
                      {remainingLeaderboard.map((player, index) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1 shadow-sm"
                        >
                          <span>
                            {index + 4}. {player.name}
                          </span>
                          <span>{player.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void handleShare();
                    }}
                    disabled={sortedPlayers.length === 0}
                    className="w-full sm:w-auto"
                  >
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetDialogOpen(true)}
                    disabled={sortedPlayers.length === 0}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Reset scores
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Clear session
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This deletes all players and scores. You cannot undo
                          this action.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={resetGame}
                        >
                          Clear
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>

        <footer className="mt-auto border-t bg-background/80">
          <div
            className={`${containerClass} flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between`}
          >
            <span>May the dice be with you.</span>
            <span>
              {state.players.length}{" "}
              {state.players.length === 1 ? "player" : "players"}
            </span>
          </div>
        </footer>
      </div>

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all scores?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set every player's score to zero without removing
              players.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear session?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all players and scores. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearConfirm}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
