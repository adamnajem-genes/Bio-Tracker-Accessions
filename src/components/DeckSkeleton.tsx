export function DeckSkeleton() {
  return (
    <div className="min-h-screen pb-16 animate-pulse">
      {/* Header placeholder */}
      <div className="glass mx-4 lg:mx-8 mt-4 h-[60px]" />
      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 h-[108px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/40" />
                <div className="h-8 w-12 rounded bg-white/40" />
              </div>
              <div className="h-3 w-24 rounded bg-white/40 mt-3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="space-y-4">
            <div className="glass-card p-4 h-[220px]">
              <div className="h-4 w-24 rounded bg-white/40 mb-3" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-xl bg-white/30 mb-1.5" />
              ))}
            </div>
            <div className="glass-card p-4 h-[180px]">
              <div className="h-4 w-24 rounded bg-white/40 mb-3" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 rounded-xl bg-white/30 mb-1.5" />
              ))}
            </div>
          </aside>
          <section className="space-y-4">
            <div className="glass-card p-4 h-[64px]" />
            <div className="glass-card overflow-hidden">
              <div className="h-12 bg-white/40 border-b border-white/60" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 border-b border-white/40 flex items-center gap-4 px-4">
                  <div className="h-6 w-20 rounded-full bg-white/30" />
                  <div className="h-4 w-28 rounded bg-white/30" />
                  <div className="h-4 w-48 rounded bg-white/30" />
                  <div className="h-4 w-24 rounded bg-white/30 ml-auto" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
