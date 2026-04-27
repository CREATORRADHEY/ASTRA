export interface AstronomyCard {
  id: number;
  year: string;
  title: string;
  subtitle?: string;
  line: string;
  /** One-line era fact / key discovery */
  fact: string;
  /** 0 = oldest/dimmest, 1 = newest/brightest */
  brightness: number;
  /** Unsplash photo URL — era-appropriate */
  imageUrl: string;
}

export const ASTRONOMY_CARDS: AstronomyCard[] = [
  {
    id: 1,
    year: "3000 BCE",
    title: "Ancient Sky Watching",
    line: "Patterns before understanding.",
    fact: "Megalithic structures aligned to solstices centuries before writing existed.",
    brightness: 0,
    // Ancient starfield — night sky as early astronomers would have seen it
    imageUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    year: "~150 CE",
    title: "The Geocentric World",
    line: "Everything centered around us.",
    fact: "Ptolemy's Almagest mapped 1,022 stars and defined Western astronomy for 1,400 years.",
    brightness: 0.17,
    // Dense star cluster — the ordered celestial sphere Ptolemy mapped
    imageUrl: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    year: "1543",
    title: "The Heliocentric Shift",
    subtitle: "Nicolaus Copernicus",
    line: "The center was never where we thought.",
    fact: "De revolutionibus displaced Earth from the cosmos's center — a revolution in cosmology.",
    brightness: 0.33,
    // The Sun — central body of the heliocentric system
    imageUrl: "https://images.unsplash.com/photo-1504192010706-dd7f569ee2be?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    year: "1609",
    title: "The Telescope Revolution",
    subtitle: "Galileo Galilei",
    line: "We began to truly see.",
    fact: "Galileo observed Jupiter's moons — the first proof that not everything orbits Earth.",
    brightness: 0.5,
    // Moon surface — what Galileo first magnified
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    year: "1687",
    title: "Laws of Motion",
    subtitle: "Isaac Newton",
    line: "The universe revealed its rules.",
    fact: "Principia Mathematica unified earthly mechanics and celestial motion into one framework.",
    brightness: 0.67,
    // Deep galaxy — Newton's laws govern their rotation
    imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    year: "1957",
    title: "The Space Age",
    line: "We reached beyond the atmosphere.",
    fact: "Sputnik — humanity's first artificial satellite — orbited Earth every 96 minutes.",
    brightness: 0.83,
    // Earth from orbit — the new view that changed everything
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 7,
    year: "1969",
    title: "Modern Exploration",
    subtitle: "Apollo 11",
    line: "We stepped into the unknown.",
    fact: "Neil Armstrong's first words from the Moon surface were broadcast live to 600 million people.",
    brightness: 1,
    // Astronaut in space — the ultimate expression of exploration
    imageUrl: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=800&q=80",
  },
];
