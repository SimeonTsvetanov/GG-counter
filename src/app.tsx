import { useState } from "react";
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
  Download,
  LayoutList,
  RefreshCw,
  Share2,
  Trophy,
  Users,
} from "lucide-react";

const maxPlayers = 16;

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

  const leaderId = summary.leader?.id ?? null;
  const remainingSlots = maxPlayers - state.players.length;
  const showInstallBanner = canInstall && !isInstalled && !installDismissed;

  const handleAddPlayer = () => {
    if (remainingSlots <= 0) {
      return;
    }

    const trimmed = newPlayerName.trim();
    addPlayer(trimmed);
    setNewPlayerName("");
  };

  const handleInstallRequest = () => {
    void promptInstall().then((accepted) => {
      if (accepted) {
        setInstallDismissed(true);
      }
    });
  };

  const handleShare = async () => {
    if (state.players.length === 0) {
      return;
    }

    const lines = state.players
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((player, index) => `${index + 1}. ${player.name}: ${player.score}`);
    const text = [`GG Counter session`, ``]
      .concat(lines)
      .concat(`Total score: ${summary.totalScore}`)
      .join("\n");

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "GG Counter session", text });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        if (typeof window !== "undefined") {
          window.alert("Session summary copied to clipboard.");
        }
      }
    } catch (error) {
      console.error("Sharing failed", error);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="safe-area flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex w-full max-w-full flex-wrap items-center justify-between gap-3 px-3 py-3 sm:max-w-5xl sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <LayoutList className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  GG Counter
                </p>
                <p className="text-xs text-muted-foreground">
                  Offline-first score tracker
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canInstall && !isInstalled && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleInstallRequest}
                  className="hidden sm:inline-flex"
                >
                  <Download className="mr-2 h-4 w-4" /> Install
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {(!isOnline || showInstallBanner) && (
          <div className="mx-auto mt-3 w-full max-w-full px-3 sm:max-w-5xl sm:px-6 lg:px-8">
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {!isOnline && (
                    <p className="text-sm font-medium text-destructive">
                      You are offline. Changes are saved locally and will sync
                      when you reconnect.
                    </p>
                  )}
                  {showInstallBanner && (
                    <p className="text-sm font-medium">
                      Install GG Counter for quicker access and offline support.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {showInstallBanner && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleInstallRequest}
                    >
                      <Download className="mr-2 h-4 w-4" /> Install app
                    </Button>
                  )}
                  {showInstallBanner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInstallDismissed(true)}
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
          <div className="mx-auto flex w-full max-w-full flex-col gap-6 px-3 py-6 sm:max-w-5xl sm:px-6 lg:px-8">
            <section className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Users className="h-4 w-4" /> Players
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {state.players.length}/{maxPlayers}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newPlayerName}
                      onChange={(event) => setNewPlayerName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && remainingSlots > 0) {
                          handleAddPlayer();
                        }
                      }}
                      placeholder={
                        remainingSlots > 0
                          ? "Add a player"
                          : "Maximum players reached"
                      }
                      aria-label="Player name"
                      disabled={remainingSlots <= 0}
                    />
                    <Button
                      onClick={handleAddPlayer}
                      disabled={remainingSlots <= 0}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {remainingSlots > 0
                      ? `${remainingSlots} open ${
                          remainingSlots === 1 ? "slot" : "slots"
                        } remaining.`
                      : "You have reached the maximum number of players."}
                  </p>
                </CardContent>
              </Card>
              <Card>
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
                <CardContent className="space-y-2">
                  <CardDescription>
                    Total score: {summary.totalScore}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleShare}
                    disabled={state.players.length === 0}
                  >
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset scores
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset all scores?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will set every player's score to zero without
                          removing players.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetScores}>
                          Reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
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
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {state.players.length === 0 ? (
                <Card className="sm:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Add your first player
                    </CardTitle>
                    <CardDescription>
                      Start a session by adding players. Scores stay saved even
                      when you go offline.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                state.players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isLeader={leaderId === player.id}
                    onRename={renamePlayer}
                    onRemove={removePlayer}
                    onAdjust={adjustScore}
                  />
                ))
              )}
            </section>
          </div>
        </main>

        <footer className="mt-auto border-t bg-background/80">
          <div className="mx-auto flex w-full max-w-full items-center justify-between gap-3 px-3 py-4 text-xs text-muted-foreground sm:max-w-5xl sm:gap-4 sm:px-6 lg:px-8">
            <span>Progress persists automatically.</span>
            <span>
              {state.players.length}{" "}
              {state.players.length === 1 ? "player" : "players"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
