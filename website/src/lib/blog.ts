import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image?: string;
  tags: string[];
  metaDescription: string;
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image?: string;
  tags: string[];
  metaDescription: string;
}

export function getSortedPostsData(): BlogPostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((name) => name.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');

      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      const matterResult = matter(fileContents);

      let readingTime: string = matterResult.data.readTime;
      if (!readingTime) {
        readingTime = calculateReadTime(matterResult.content);
      }

      return {
        slug,
        ...matterResult.data,
        readTime: readingTime,
      } as BlogPostMeta;
    });

  return allPostsData.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((name) => name.endsWith('.md'))
    .map((fileName) => {
      return {
        params: {
          slug: fileName.replace(/\.md$/, ''),
        },
      };
    });
}

export async function getPostData(slug: string): Promise<BlogPost> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { 
      behavior: 'wrap',
      properties: { className: ['heading-link'] }
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(matterResult.content);
  
  const contentHtml = processedContent.toString();

  let readingTime: string = matterResult.data.readTime;
  if (!readingTime) {
    readingTime = calculateReadTime(matterResult.content);
  }

  return {
    slug,
    content: contentHtml,
    ...matterResult.data,
    readTime: readingTime,
  } as BlogPost;
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  const allPosts = getSortedPostsData();
  if (category === 'All') {
    return allPosts;
  }
  return allPosts.filter((post) => post.category === category);
}

export function searchPosts(query: string): BlogPostMeta[] {
  const allPosts = getSortedPostsData();
  const searchTerm = query.toLowerCase();
  
  return allPosts.filter((post) => 
    post.title.toLowerCase().includes(searchTerm) ||
    post.excerpt.toLowerCase().includes(searchTerm) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}

export function getCategories(): string[] {
  const allPosts = getSortedPostsData();
  const categories = ['All'];
  
  allPosts.forEach((post) => {
    if (!categories.includes(post.category)) {
      categories.push(post.category);
    }
  });
  
  return categories;
}

export function getRecentPosts(limit: number = 3): BlogPostMeta[] {
  const allPosts = getSortedPostsData();
  return allPosts.slice(0, limit);
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPostMeta[] {
  const allPosts = getSortedPostsData();
  const currentPost = allPosts.find(post => post.slug === currentSlug);
  
  if (!currentPost) {
    return [];
  }
  
  // Find posts with matching tags or category
  const relatedPosts = allPosts
    .filter(post => post.slug !== currentSlug)
    .filter(post => 
      post.category === currentPost.category ||
      post.tags.some(tag => currentPost.tags.includes(tag))
    )
    .slice(0, limit);
    
  return relatedPosts;
}

export function calculateReadTime(content: string): string {
  const wordsPerMinute = 215;
  
  if (!content) {
    return "1 min read";
  }
  
  // Remove markdown syntax and HTML tags for accurate word count
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
    .replace(/[#*_~`]/g, '') // Remove markdown formatting
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  const wordCount = cleanContent.split(' ').filter(word => word.length > 0).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  
  const minutes = Math.max(1, readTime);

  return `${minutes} min read`;
}
