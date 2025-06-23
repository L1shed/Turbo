import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { GetStaticProps, GetStaticPaths } from 'next';
import { 
  Zap, 
  Calendar, 
  User, 
  ArrowLeft,
  Clock,
  Tag,
  Share2,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react';
import { getAllPostSlugs, getPostData, getRelatedPosts, BlogPost, BlogPostMeta } from '../../lib/blog';

// Import highlight.js CSS for code syntax highlighting
import 'highlight.js/styles/github-dark.css';
import Layout from '@/components/Layout';

interface BlogPostPageProps {
  postData: BlogPost;
  relatedPosts: BlogPostMeta[];
}

export default function BlogPostPage({ postData, relatedPosts }: BlogPostPageProps) {
  const shareUrl = `https://turbo.network/blog/${postData.slug}`;
  const shareText = `${postData.title} - ${postData.excerpt}`;

  return (
    <>
      <Head>
        <title>{postData.title} - Turbo Blog</title>
        <meta name="description" content={postData.metaDescription} />
        <meta name="keywords" content={postData.tags.join(', ')} />
        <meta name="author" content={postData.author} />
        <meta property="article:published_time" content={postData.date} />
        <meta property="article:author" content={postData.author} />
        <meta property="article:section" content={postData.category} />
        {postData.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {/* Open Graph */}
        <meta property="og:title" content={postData.title} />
        <meta property="og:description" content={postData.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={shareUrl} />
        {postData.image && <meta property="og:image" content={postData.image} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={postData.title} />
        <meta name="twitter:description" content={postData.metaDescription} />
        {postData.image && <meta name="twitter:image" content={postData.image} />}
        
        <link rel="canonical" href={shareUrl} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": postData.title,
              "description": postData.metaDescription,
              "author": {
                "@type": "Person",
                "name": postData.author
              },
              "datePublished": postData.date,
              "dateModified": postData.date,
              "publisher": {
                "@type": "Organization",
                "name": "Turbo",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://turbo.network/logo.png"
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": shareUrl
              },
              "image": postData.image || "https://turbo.network/default-blog-image.jpg",
              "keywords": postData.tags.join(", "),
              "articleSection": postData.category
            })
          }}
        />
      </Head>

        <Layout theme='light'>

        {/* Article Container */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back to Blog */}
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Article Header */}
          <header className="mb-12">
            {/* Category Badge */}
            <span className="inline-block bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              {postData.category}
            </span>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {postData.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {postData.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-gray-500 mb-8">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{postData.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <time dateTime={postData.date}>
                  {new Date(postData.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{postData.readTime}</span>
              </div>
            </div>

            {/* Tags */}
            {postData.tags && postData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {postData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Share Buttons */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Share:</span>
              <div className="flex gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12">
            <div 
              className="prose-blog"
              dangerouslySetInnerHTML={{ __html: postData.content }}
            />
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    <article className="group cursor-pointer">
                      <div className="bg-gradient-to-br from-orange-100 to-orange-200 h-32 rounded-lg mb-4 relative overflow-hidden">
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-white/90 backdrop-blur-sm text-orange-600 px-2 py-1 rounded text-xs font-medium">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{post.author}</span>
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostSlugs();
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const postData = await getPostData(params?.slug as string);
  const relatedPosts = getRelatedPosts(params?.slug as string);
  
  return {
    props: {
      postData,
      relatedPosts,
    },
  };
};
