import { marked } from 'marked';

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
};

export type BlogPost = BlogPostMeta & {
  html: string;
};

const markdownFiles = import.meta.glob('../../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: match[2] };
}

function parsePost(raw: string, fallbackSlug: string): BlogPost {
  const { data, body } = parseFrontmatter(raw);
  const slug = data.slug || fallbackSlug;
  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    date: data.date || '',
    html: marked.parse(body, { async: false }) as string,
  };
}

function allPosts(): BlogPost[] {
  return Object.entries(markdownFiles)
    .map(([filepath, raw]) => {
      const fallbackSlug = filepath.split('/').pop()?.replace(/\.md$/, '') || 'post';
      return parsePost(raw, fallbackSlug);
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllPosts(): BlogPostMeta[] {
  return allPosts().map(({ slug, title, description, date }) => ({
    slug,
    title,
    description,
    date,
  }));
}

export function getPostBySlug(slug: string): BlogPost | null {
  return allPosts().find((post) => post.slug === slug) ?? null;
}

export function formatPostDate(date: string): string {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
