import { NextRequest, NextResponse } from 'next/server';
import { ScenicImage } from '@/types';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['mountain', 'valley', 'sunset', 'travel'] as const;

// Curated high-resolution cinematic landscapes from Unsplash
const CURATED_LANDSCAPES: ScenicImage[] = [
  {
    id: 'uns-mountain-1',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=100&q=20',
    title: 'Majestic Snowy Mountain Ridge at Twilight',
    author: 'Kaley Dykstra',
    location: 'Mount Rainier National Park, USA',
    category: 'mountain'
  },
  {
    id: 'uns-valley-1',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=20',
    title: 'Peaceful Yosemite Valley River Reflection',
    author: 'Bailey Zindel',
    location: 'Yosemite National Park, California',
    category: 'valley'
  },
  {
    id: 'uns-sunset-1',
    url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=100&q=20',
    title: 'Golden Hour Mountain Sunset and Fog',
    author: 'Luca Bravo',
    location: 'Dolomites, Italy',
    category: 'sunset'
  },
  {
    id: 'uns-travel-1',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=100&q=20',
    title: 'Open Road Through Desert Mountains',
    author: 'Dino Reichmuth',
    location: 'Utah Scenic Byway, USA',
    category: 'travel'
  },
  {
    id: 'uns-mountain-2',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=100&q=20',
    title: 'Starry Sky Above Snow Peak',
    author: 'Benjamin Voros',
    location: 'Swiss Alps, Switzerland',
    category: 'mountain'
  },
  {
    id: 'uns-valley-2',
    url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=100&q=20',
    title: 'Serene Alpine Lake in Green Valley',
    author: 'Luca Bravo',
    location: 'Lago di Braies, Italy',
    category: 'valley'
  },
  {
    id: 'uns-sunset-2',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=20',
    title: 'Warm Sunset Over Calming Ocean Coast',
    author: 'Sean Oulashin',
    location: 'Tropical Coastline',
    category: 'sunset'
  },
  {
    id: 'uns-travel-2',
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=100&q=20',
    title: 'Scenic Travel Wandering Through Misty Peaks',
    author: 'Francesca Hotchin',
    location: 'Faroe Islands',
    category: 'travel'
  },
  {
    id: 'uns-mountain-3',
    url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=100&q=20',
    title: 'Snowy Alpine Summits in Crisp Morning Air',
    author: 'Christopher Campbell',
    location: 'Austrian Alps',
    category: 'mountain'
  },
  {
    id: 'uns-valley-3',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=100&q=20',
    title: 'Golden Sunlight Streaming Through Valley Forest',
    author: 'Dan Meyers',
    location: 'Olympic National Park, USA',
    category: 'valley'
  },
  {
    id: 'uns-sunset-3',
    url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=100&q=20',
    title: 'Vibrant Orange Sunset Over Rolling Valleys',
    author: 'Sébastien Goldberg',
    location: 'Provence, France',
    category: 'sunset'
  },
  {
    id: 'uns-travel-3',
    url: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=100&q=20',
    title: 'Traveler Overlooking Misty Mountain Horizon',
    author: 'Fabio Comparelli',
    location: 'Highlands, Scotland',
    category: 'travel'
  },
  {
    id: 'uns-mountain-4',
    url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=100&q=20',
    title: 'Dramatic Mountain Ridge Under Dramatic Clouds',
    author: 'Eberhard Grossgasteiger',
    location: 'South Tyrol, Italy',
    category: 'mountain'
  },
  {
    id: 'uns-valley-4',
    url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=100&q=20',
    title: 'Emerald Green Valley River Flow',
    author: 'Willian Justen de Vasconcellos',
    location: 'Norwegian Fjords',
    category: 'valley'
  },
  {
    id: 'uns-sunset-4',
    url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=100&q=20',
    title: 'Purple and Crimson Mountain Twilight',
    author: 'Kalen Emsley',
    location: 'Banff National Park, Canada',
    category: 'sunset'
  },
  {
    id: 'uns-travel-4',
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2560&q=85',
    blurUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=100&q=20',
    title: 'Wooden Boat on Crystal Clear Mountain Waters',
    author: 'Luca Bravo',
    location: 'Bled, Slovenia',
    category: 'travel'
  }
];

// Minimal shapes for the two upstream APIs we read from, covering only the
// fields this route actually touches (avoids `any` without trying to model
// the full API surface of either service).
type ScenicCategory = ScenicImage['category'];

interface WikimediaImageInfo {
  url?: string;
  thumburl?: string;
  responsiveUrls?: Record<string, string>;
  extmetadata?: {
    Artist?: { value?: string };
    ObjectName?: { value?: string };
    ImageDescription?: { value?: string };
  };
}

interface WikimediaPage {
  pageid?: number;
  title?: string;
  imageinfo?: WikimediaImageInfo[];
}

interface WikimediaQueryResponse {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
}

interface UnsplashPhoto {
  id: string;
  urls: { raw: string; thumb: string };
  alt_description?: string | null;
  description?: string | null;
  user?: { name?: string };
  location?: { name?: string; title?: string };
}

// Fetch dynamically from Wikimedia Commons Image API
async function fetchWikimediaImages(category: ScenicCategory): Promise<ScenicImage[]> {
  try {
    const searchTerm = `${category} landscape nature scenic sunset`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      searchTerm + ' width:>1920'
    )}&gsrlimit=8&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=2560&format=json&origin=*`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'CinematicMusic/1.0 (NextJsApp)' },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];
    const data = (await res.json()) as WikimediaQueryResponse;
    const pages = Object.values(data.query?.pages || {});

    const images: ScenicImage[] = [];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info?.url) continue;

      const titleLower = (p.title || '').toLowerCase();
      // Skip books, documents, maps, pdfs, scans
      if (
        titleLower.includes('.pdf') ||
        titleLower.includes('book') ||
        titleLower.includes('document') ||
        titleLower.includes('archive') ||
        titleLower.includes('text') ||
        titleLower.includes('map') ||
        titleLower.includes('chart')
      ) {
        continue;
      }

      const metadata = info.extmetadata || {};
      const author =
        metadata.Artist?.value?.replace(/<[^>]+>/g, '').trim() ||
        'Scenic Photographer';
      const cleanTitle = (p.title || '').replace(/^File:/, '').replace(/\.[a-zA-Z0-9]+$/, '');
      const rawLocation = metadata.ObjectName?.value || metadata.ImageDescription?.value || `${category.charAt(0).toUpperCase() + category.slice(1)} Landscape`;
      const cleanLocation = rawLocation.replace(/<[^>]+>/g, '').trim();

      images.push({
        id: `wiki_${p.pageid}`,
        url: info.responsiveUrls?.['2560'] || info.thumburl || info.url,
        blurUrl: info.thumburl || info.url,
        title: cleanTitle,
        author: author.length > 35 ? author.slice(0, 35) + '...' : author,
        location: cleanLocation.length > 50 ? cleanLocation.slice(0, 50) + '...' : cleanLocation,
        category
      });
    }

    return images;
  } catch (err) {
    console.error('Wikimedia fetch error:', err);
    return [];
  }
}

// Fetch from Unsplash official API if key is present
async function fetchUnsplashOfficial(category: ScenicCategory): Promise<ScenicImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];

  try {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
      category + ' landscape cinematic wallpaper'
    )}&orientation=landscape&count=8&client_id=${accessKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const photos = (await res.json()) as UnsplashPhoto[];

    return photos.map((p) => ({
      id: `uns_${p.id}`,
      url: `${p.urls.raw}&auto=format&fit=crop&w=2560&q=85`,
      blurUrl: p.urls.thumb,
      title: p.alt_description || p.description || `${category} Scenery`,
      author: p.user?.name || 'Unsplash Photographer',
      location: p.location?.name || p.location?.title || '',
      category
    }));
  } catch (err) {
    console.error('Unsplash API fetch error:', err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category') || '';
    const validCategory = (CATEGORIES.includes(categoryParam as ScenicCategory)
      ? categoryParam
      : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]) as ScenicCategory;

    // 1. Check Unsplash official API if key is configured
    let onlineImages = await fetchUnsplashOfficial(validCategory);

    // 2. Query Wikimedia Commons dynamically for free public images
    if (onlineImages.length === 0) {
      onlineImages = await fetchWikimediaImages(validCategory);
    }

    // 3. Combine with curated Unsplash landscapes for guaranteed high-quality cinematic visuals
    const curatedMatches = CURATED_LANDSCAPES.filter(
      (img) => !categoryParam || img.category === validCategory
    );

    const pool = [...onlineImages, ...curatedMatches];
    // Shuffle pool
    const shuffled = pool.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      category: validCategory,
      count: shuffled.length,
      images: shuffled
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    // Return curated fallback on error
    const shuffled = [...CURATED_LANDSCAPES].sort(() => Math.random() - 0.5);
    return NextResponse.json({
      success: true,
      category: 'mountain',
      count: shuffled.length,
      images: shuffled
    });
  }
}
