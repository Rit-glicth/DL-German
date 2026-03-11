import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Youtube, Newspaper, Laugh, Film, Music, Tv, X } from "lucide-react";

const CATEGORIES = [
  { id: "cartoons", label: "Cartoons & Animation", icon: Tv, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "news", label: "News", icon: Newspaper, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "comedy", label: "Comedy", icon: Laugh, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { id: "docs", label: "Documentaries", icon: Film, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "nursery", label: "Kinderlieder", icon: Music, color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: "trailers", label: "Movie Trailers", icon: Film, color: "text-amber-500", bg: "bg-amber-500/10" },
];

// Each item has a youtube_id for direct embedding
const MEDIA = {
  cartoons: [
    { title: "Oktonauten – Folge auf Deutsch", desc: "Sea-creature vocabulary. Octonauts in German.", youtube_id: "R_2o_-BDsC0" },
    { title: "Miraculous – Stürmisches Wetter", desc: "Very first Miraculous episode – meet Ladybug & Cat Noir.", youtube_id: "vPnKNBCRCBs" },
    { title: "LEGO Ninjago Deutsch – Das Erwachen der Schlangen", desc: "Classic Ninjago episode in German.", youtube_id: "0JDqyY6qjqI" },
    { title: "PJ Masks Deutsch", desc: "Pyjama Heroes action-packed episode in German.", youtube_id: "v1brlCMa4Gs" },
    { title: "Barbie Traumvilla Abenteuer – Deutsch", desc: "Barbie Dreamhouse Adventures auf Deutsch.", youtube_id: "NjIyYTNj6M4" },
    { title: "Peppa Wutz – Deutsch", desc: "Peppa Pig auf Deutsch — perfect for beginners.", youtube_id: "3DINFv-YXDM" },
    { title: "Bob der Baumeister", desc: "Bob the Builder auf Deutsch — great for basic vocab.", youtube_id: "VGbq2pBQqd8" },
    { title: "Paxi – Der Weltraum", desc: "ESA's Paxi explains the solar system in German.", youtube_id: "HFhhO5ld98c" },
  ],
  news: [
    { title: "Tagesschau in 100 Sekunden", desc: "Germany's most famous bite-sized daily news in perfect Hochdeutsch.", youtube_id: "3hTrCB0iFwM" },
    { title: "DW Nachrichten – Deutschland heute", desc: "Deutsche Welle's daily German news bulletin.", youtube_id: "Hq39LE812eI" },
    { title: "ZDF heute-show – Best of", desc: "Germany's satirical news comedy show.", youtube_id: "IrFhLGjGkXI" },
    { title: "Logo! Nachrichten für Kinder", desc: "ZDF's kid-friendly news program — slower pace, perfect for learners.", youtube_id: "6Jjy1S8ZBHA" },
  ],
  comedy: [
    { title: "Knallerfrauen – Beste Sketche", desc: "Martina Hill sketch comedy — very physical and hilarious.", youtube_id: "IgWKMiAlV8M" },
    { title: "Kaya Yanar – Was guckst du?!", desc: "Germany's biggest multicultural comedian live show.", youtube_id: "OIw-yYjB7Eo" },
    { title: "Carolin Kebekus – PussyTerror TV Best Of", desc: "Germany's top female comedian on politics and culture.", youtube_id: "K7gGTBnCNPQ" },
    { title: "Heute-show – Beste Szenen", desc: "Deadpan political satire. Great advanced German practice.", youtube_id: "8_i0d9VrIFc" },
    { title: "Neo Magazin Royale – Jan Böhmermann", desc: "Böhmermann's award-winning satirical late night show.", youtube_id: "dnCO4KMfO8I" },
  ],
  docs: [
    { title: "Terra X – Faszination Erde: Wälder Deutschlands", desc: "Stunning ZDF documentary about Germany's forests.", youtube_id: "3hT7TmMdT3M" },
    { title: "Y-Kollektiv – Vanlife Deutschland", desc: "Young Germans living full-time in vans.", youtube_id: "3hT7TmMdT3M" },
    { title: "ARTE Doku – Das Geheimnis der Pilze", desc: "Visually stunning look at the secret world of fungi.", youtube_id: "GYpBpBX1UN0" },
    { title: "Terra X – Die Kelten", desc: "Deep dive into Celtic history in Europe, narrated in clear German.", youtube_id: "j3vFwuT4-8U" },
    { title: "ZDFinfo – Mythos Atlantis", desc: "The Atlantis legend investigated — great B2 listening practice.", youtube_id: "HX9JIb-_kZE" },
  ],
  nursery: [
    { title: "Alle meine Entchen", desc: "The most iconic German children's song. Every German knows it.", youtube_id: "3SbMmqwH5nE" },
    { title: "Backe backe Kuchen", desc: "Baking ingredients song — eggs, butter, flour, milk. Perfect food vocab.", youtube_id: "YFKjkJfqpLg" },
    { title: "Bruder Jakob", desc: "The German Frère Jacques. You know the tune already!", youtube_id: "Z3xAnxs6utE" },
    { title: "Hänschen klein", desc: "Action verbs and family words. A little story about a boy who leaves home.", youtube_id: "CiSUgxNRqAQ" },
    { title: "Grün, grün, grün sind alle meine Kleider", desc: "Colors AND professions in one earworm.", youtube_id: "FEjI3YOQBrk" },
    { title: "Aramsamsam", desc: "Physical, fast-paced kindergarten hit — trains German pronunciation.", youtube_id: "bkXOOlbrSos" },
  ],
  trailers: [
    { title: "Fack ju Göhte – Offizieller Trailer", desc: "Massive comedy hit — an ex-con accidentally becomes a substitute teacher.", youtube_id: "qiE88vbqkQc" },
    { title: "Good Bye, Lenin! – Trailer Deutsch", desc: "A boy hides the fall of the Berlin Wall from his sick mother.", youtube_id: "4MKHp5EedxA" },
    { title: "Das Leben der Anderen – Trailer", desc: "Oscar-winning thriller — a Stasi agent spies on a playwright.", youtube_id: "Io2eRidepnY" },
    { title: "Toni Erdmann – Trailer Deutsch", desc: "An eccentric father tries to reconnect with his uptight daughter.", youtube_id: "qCBXqQBxkEg" },
    { title: "Im Westen nichts Neues – Trailer", desc: "2022 Oscar-winning All Quiet on the Western Front.", youtube_id: "hf8EYbVxtCY" },
    { title: "Victoria – Trailer Deutsch", desc: "A thriller shot in ONE continuous take through Berlin streets.", youtube_id: "9cTIBJPkiW0" },
    { title: "Systemsprenger – Trailer", desc: "Raw drama about a girl bouncing around the foster care system.", youtube_id: "n1JH6SjXGoI" },
  ],
};

export default function GermanMedia({ isDark }) {
  const [activeCategory, setActiveCategory] = useState("cartoons");
  const [playing, setPlaying] = useState(null); // youtube_id or null

  const cat = CATEGORIES.find(c => c.id === activeCategory);
  const items = MEDIA[activeCategory] || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
          German Media
        </h1>
        <p className={cn("text-sm mt-1", isDark ? "text-slate-300" : "text-slate-500")}>
          Cartoons, news, comedy, documentaries, nursery rhymes and movies — all in German. Click to play.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          const isActive = activeCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => { setActiveCategory(c.id); setPlaying(null); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ring-1",
                isActive
                  ? isDark ? "bg-white/10 ring-white/20 text-white" : "bg-slate-900 ring-slate-900 text-white"
                  : isDark ? "ring-slate-700 text-slate-200 hover:ring-slate-500 hover:bg-slate-800" : "ring-slate-200 text-slate-600 hover:ring-slate-300 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : c.color)} />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Inline player */}
      {playing && (
        <div className={cn("rounded-2xl overflow-hidden ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-slate-900 ring-slate-700")}>
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-white text-sm font-medium truncate">
              {items.find(i => i.youtube_id === playing)?.title || "Now Playing"}
            </p>
            <button onClick={() => setPlaying(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              key={playing}
              src={`https://www.youtube-nocookie.com/embed/${playing}?autoplay=1&rel=0`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="German Media Player"
            />
          </div>
        </div>
      )}

      {/* Section header */}
      <div className={cn("flex items-center gap-3 p-4 rounded-2xl ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cat?.bg)}>
          {cat && <cat.icon className={cn("w-5 h-5", cat.color)} />}
        </div>
        <div>
          <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-slate-900")}>{cat?.label}</h2>
          <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>{items.length} videos — click any card to play inline</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, i) => {
          const isPlaying = playing === item.youtube_id;
          return (
            <button
              key={i}
              onClick={() => setPlaying(isPlaying ? null : item.youtube_id)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-2xl ring-1 transition-all group text-left",
                isPlaying
                  ? isDark ? "bg-red-500/10 ring-red-500/40" : "bg-red-50 ring-red-300"
                  : isDark
                  ? "bg-slate-900 ring-slate-800 hover:ring-red-500/40 hover:bg-slate-800"
                  : "bg-white ring-slate-200 hover:ring-red-300 hover:shadow-sm"
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors", isPlaying ? "bg-red-500/20" : "bg-red-500/10 group-hover:bg-red-500/20")}>
                <Youtube className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold leading-snug", isDark ? "text-white" : "text-slate-900")}>{item.title}</p>
                <p className={cn("text-xs mt-1 leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>{item.desc}</p>
                {isPlaying && <span className="text-xs text-red-500 font-medium mt-1 block">Now playing ▲</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}