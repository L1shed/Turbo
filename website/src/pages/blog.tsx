import React, { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { GetStaticProps } from "next";
import { Calendar, User, ArrowRight, Search, Tag, Clock } from "lucide-react";
import { getSortedPostsData, getCategories, BlogPostMeta } from "../lib/blog";
import Layout from "../components/Layout";

interface BlogPageProps {
  allPostsData: BlogPostMeta[];
  categories: string[];
}

export default function BlogPage({ allPostsData, categories }: BlogPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPosts = allPostsData.filter((post) => {
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Head>
        <title>
          Turbo Blog - Latest Updates, Tutorials & Technical Insights
        </title>
        <meta
          name="description"
          content="Stay updated with the latest news, tutorials, and technical insights from the Turbo decentralized bandwidth sharing network. Learn about node optimization, earnings strategies, and technical deep dives."
        />
        <meta
          name="keywords"
          content="turbo, bandwidth sharing, decentralized network, distributed system, cryptocurrency, passive income, tutorials"
        />
        <meta
          property="og:title"
          content="Turbo Blog - Latest Updates, Tutorials & Technical Insights"
        />
        <meta
          property="og:description"
          content="Stay updated with the latest news, tutorials, and technical insights from the Turbo ecosystem"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://turbo.network/blog" />
      </Head>

      <Layout theme="light">
        {/* Hero Section - Clean Paper Style */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              Turbo <span className="text-orange-600">Blog</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Stay updated with the latest news, tutorials, and insights from
              the Turbo ecosystem
            </p>
            <div className="w-24 h-1 bg-orange-600 mx-auto rounded-full"></div>
          </div>
        </section>

        {/* Search and Filter - Clean Design */}
        <section className="px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                      selectedCategory === category
                        ? "bg-orange-600 text-white shadow-lg transform scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts - Enhanced Card Design */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No articles found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or category filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <article key={post.slug} className="group">
                    <Link href={`/blog/${post.slug}`}>
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] h-full flex flex-col">
                        <div className="p-8 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                              {post.category}
                            </span>
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{post.readTime}</span>
                            </div>
                          </div>

                          <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors flex-shrink-0">
                            {post.title}
                          </h2>

                          <p className="text-gray-600 mb-6 line-clamp-3 flex-1">
                            {post.excerpt}
                          </p>

                          <div className="space-y-4 mt-auto">
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="font-medium">
                                  {post.author}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(post.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-orange-600 font-medium text-sm group-hover:underline">
                                Read more
                                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {post.tags && post.tags.length > 0 && (
                          <div className="px-8 pb-6">
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const allPostsData = getSortedPostsData();
  const categories = getCategories();

  return {
    props: {
      allPostsData,
      categories,
    },
  };
};
